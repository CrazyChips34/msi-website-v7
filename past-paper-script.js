const AWS = require('aws-sdk');
const fs = require('fs');
const path = require('path');

// CONFIG
const S3_BUCKET_NAME = 'msi-resources-pages';
const S3_BUCKET_URL = 'https://d1dc40k4xbphr.cloudfront.net';
const OUTPUT_FILE = 'guidelinesData.ts';

// Set AWS Region
AWS.config.update({ region: 'eu-west-1' });

// AWS S3 Client
const s3 = new AWS.S3();

// Helper Functions
const mapSubjectName = (folderName) => {
    const mapping = {
        "maths": "Maths",
        "science": "Science"
        // Add other subjects as needed
    };
    return mapping[folderName.toLowerCase()] || folderName.charAt(0).toUpperCase() + folderName.slice(1);
};

// Extract year from filename
const extractYear = (filename) => {
    // Try to find a 4-digit year in the filename
    const yearMatch = filename.match(/\b(20\d{2})\b/);
    return yearMatch ? yearMatch[1] : null;
};

// Extract grade from path or filename
const extractGrade = (path, filename) => {
    // First try to get grade from path
    const gradeMatch = path.match(/grade(\d+)/i);
    if (gradeMatch && gradeMatch[1]) {
        return gradeMatch[1];
    }
    
    // If not found in path, try filename
    const filenameGradeMatch = filename.match(/grade\s*(\d+)/i);
    if (filenameGradeMatch && filenameGradeMatch[1]) {
        return filenameGradeMatch[1];
    }
    
    return null;
};

// Generate a clean title from filename
const generateTitle = (subject, grade, filename) => {
    // Extract year if present
    const year = extractYear(filename);
    
    // Clean up filename by removing common patterns
    let cleanTitle = filename
        .replace(/\.pdf$|\.docx$|\.zip$/i, '')
        .replace(/(additional|notes|to|the|marking|guideline|guidelines|common|examination|grade|paper|p\d+)/gi, ' ')
        .replace(/\d{4}/g, '')
        .trim();
    
    // If the clean title is too short or empty, use a default format
    if (cleanTitle.length < 5) {
        return `${subject} Grade ${grade} Guidelines ${year ? year : ''}`.trim();
    }
    
    return `${subject} Grade ${grade} - ${cleanTitle} ${year ? '(' + year + ')' : ''}`.trim();
};

// Generate direct S3 URL for a file
const generateS3Url = (objectKey) => {
    return `${S3_BUCKET_URL}/${encodeURIComponent(objectKey)}`;
};

// Main Function to Scan S3 Bucket for Guidelines
const scanS3BucketForGuidelines = async () => {
    try {
        const params = {
            Bucket: S3_BUCKET_NAME,
            Prefix: "MSI PastPapers/"
        };

        const guidelinesData = [];
        const processedFiles = new Set(); // To track processed files

        let data;
        do {
            // Fetch objects from the S3 bucket
            data = await s3.listObjectsV2(params).promise();

            // Process each file in the S3 bucket
            for (const obj of data.Contents) {
                const fileKey = obj.Key;
                const filename = path.basename(fileKey);
                
                // Skip if not a guideline file or if it's a folder
                if (!fileKey.includes('guidelines') || !filename.match(/\.(pdf|docx|zip)$/i)) {
                    continue;
                }
                
                // Skip if we've already processed this file
                if (processedFiles.has(fileKey)) {
                    continue;
                }
                processedFiles.add(fileKey);
                
                // Extract path components
                const pathParts = fileKey.split('/');
                
                // Get subject from path
                let subject = null;
                for (const part of pathParts) {
                    if (part.toLowerCase() === "maths" || part.toLowerCase() === "science") {
                        subject = mapSubjectName(part);
                        break;
                    }
                }
                
                // Extract grade from path or filename
                const grade = extractGrade(fileKey, filename);
                
                // Extract year from filename
                const year = extractYear(filename);
                
                // Skip if we can't determine the subject or grade
                if (!subject || !grade) {
                    console.log(`Skipping file with missing data: ${fileKey}`);
                    continue;
                }

                // Generate title based on filename
                const title = generateTitle(subject, grade, filename);
                
                // Generate direct S3 URL
                const url = generateS3Url(fileKey);
                
                // Create data entry
                const dataEntry = {
                    title: title,
                    url: url,
                    grade: `Grade ${grade}`,
                    subject: subject,
                    examType: "Guidelines",
                    year: year || ""
                };
                
                guidelinesData.push(dataEntry);
            }

            // Continue if there are more files
            params.ContinuationToken = data.NextContinuationToken;
        } while (data.IsTruncated);

        // Sort data by subject, grade, then year (desc)
        guidelinesData.sort((a, b) => {
            if (a.subject !== b.subject) return a.subject.localeCompare(b.subject);
            
            // Extract grade numbers for numeric comparison
            const aGradeNum = parseInt(a.grade.replace(/\D/g, ''), 10);
            const bGradeNum = parseInt(b.grade.replace(/\D/g, ''), 10);
            
            if (aGradeNum !== bGradeNum) return aGradeNum - bGradeNum;
            
            // Sort by year (descending)
            return b.year.localeCompare(a.year);
        });

        // Generate the JavaScript file with the data
        const jsContent = `// Export the guidelines data
export const guidelinesData = ${JSON.stringify(guidelinesData, null, 2)};
`;

        // Write to file
        fs.writeFileSync(OUTPUT_FILE, jsContent);
        console.log(`✅ Successfully processed ${guidelinesData.length} guideline files`);
        console.log(`✅ Guidelines data saved to ${OUTPUT_FILE}`);
    } catch (err) {
        console.error("❌ Error scanning S3 bucket:", err);
    }
};

// Run the function
scanS3BucketForGuidelines();