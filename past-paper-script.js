const AWS = require('aws-sdk');
const fs = require('fs');
const path = require('path');

// CONFIG
const S3_BUCKET_NAME = 'msi-resources-pages';
const S3_BUCKET_URL = 'https://d1dc40k4xbphr.cloudfront.net';
const OUTPUT_FILE = 'pastpapers_urls.json';

// Set AWS Region
AWS.config.update({ region: 'eu-west-1' }); // Make sure to set the correct region

// AWS S3 Client
const s3 = new AWS.S3();

// Helper Functions
const mapSubjectName = (folderName) => {
    const mapping = {
        "maths": "Maths",
        "science": "Science"
        // Add other mappings if needed
    };
    return mapping[folderName.toLowerCase()] || folderName.charAt(0).toUpperCase() + folderName.slice(1);
};

const detectExamType = (filename) => {
    const lowerFilename = filename.toLowerCase();
    
    // Simple detection based on keywords in filename
    if (lowerFilename.includes('guidelines')) return "Final";
    if (lowerFilename.includes('midyear')) return "Midyear";
    
    return "Unknown";
};

const generateS3Url = (subject, grade, year, examType) => {
    const filename = `${subject.toLowerCase()}_grade${grade}_${year}_${examType.toLowerCase()}.zip`;
    return `${S3_BUCKET_URL}/MSI%20PastPapers/${subject.toLowerCase()}/grade${grade}/${year}/${filename}`;
};

// Main Function to Scan S3 Bucket
const scanS3Bucket = async () => {
    try {
        const params = {
            Bucket: S3_BUCKET_NAME,
            Prefix: "MSI PastPapers/"  // Folder prefix in S3
        };

        const fileData = [];

        let data;
        do {
            // Fetch objects from the S3 bucket
            data = await s3.listObjectsV2(params).promise();

            // Process each file in the S3 bucket
            for (const obj of data.Contents) {
                const fileKey = obj.Key;
                
                // Skip folders or non-relevant files
                if (!fileKey.match(/\.(pdf|docx|zip)$/i)) continue;
                
                // Extract path components
                const pathParts = fileKey.split('/');
                
                // Check if we have enough path components to parse
                if (pathParts.length < 4) continue;
                
                // Parse the path to extract meaningful data
                let subject = '';
                let grade = '';
                let year = '';
                let examType = '';
                
                // Expected structure: "MSI PastPapers/subject/grade/year/..."
                // But we'll handle potentially different structures
                // First try to identify subject, grade, and year from the path
                
                // Looking at the example output, we need to handle paths like:
                // "MSI PastPapers/maths/grade10/2016/..."
                // or "MSI PastPapers/grade10/grade2016/..."
                
                // Try to find subject (maths, science, etc.)
                for (let i = 1; i < pathParts.length; i++) {
                    const part = pathParts[i].toLowerCase();
                    if (part === "maths" || part === "science") {
                        subject = mapSubjectName(part);
                        break;
                    }
                }
                
                // Try to find grade number
                for (let i = 1; i < pathParts.length; i++) {
                    const gradeMatch = pathParts[i].match(/grade(\d+)/i);
                    if (gradeMatch && gradeMatch[1]) {
                        grade = gradeMatch[1];
                        break;
                    }
                }
                
                // Try to find year (4-digit number or in a part containing year)
                for (let i = 1; i < pathParts.length; i++) {
                    const yearMatch = pathParts[i].match(/(\d{4})/);
                    if (yearMatch && yearMatch[1]) {
                        year = yearMatch[1];
                        break;
                    }
                }
                
                // Get the filename to detect exam type
                const filename = path.basename(fileKey);
                examType = detectExamType(filename);
                
                // Skip entries with invalid data
                if (!subject || !grade || !year || examType === "Unknown") {
                    continue;
                }
                
                // Generate correct URL
                const url = generateS3Url(subject, grade, year, examType);
                
                // Create entry with proper format
                const dataEntry = {
                    title: `${subject} Grade ${grade} ${examType} ${year}`,
                    url: url,
                    grade: `Grade ${grade}`,
                    subject: subject,
                    year: year,
                    examType: examType
                };
                
                fileData.push(dataEntry);
            }

            // If there are more files, continue fetching them
            params.ContinuationToken = data.NextContinuationToken;
        } while (data.IsTruncated);  // Continue if there are more files

        // Sort the data by subject, grade, year, and examType
        fileData.sort((a, b) => {
            if (a.subject !== b.subject) return a.subject.localeCompare(b.subject);
            if (a.grade !== b.grade) {
                // Extract numbers for numeric comparison
                const aNum = parseInt(a.grade.replace(/\D/g, ''), 10);
                const bNum = parseInt(b.grade.replace(/\D/g, ''), 10);
                return aNum - bNum;
            }
            if (a.year !== b.year) return b.year.localeCompare(a.year); // Newest first
            return a.examType.localeCompare(b.examType);
        });

        // Save the data to a JSON file
        fs.writeFileSync(OUTPUT_FILE, JSON.stringify(fileData, null, 4));

        console.log(`✅ Done! Metadata saved at ${OUTPUT_FILE}`);
    } catch (err) {
        console.error("❌ Error: ", err);
    }
};

// Run the function
scanS3Bucket();