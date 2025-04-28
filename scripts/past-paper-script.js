const AWS = require('aws-sdk');
const fs = require('fs');
const path = require('path');

// CONFIG
const S3_BUCKET_NAME = 'msi-resources-pages';  // The bucket name
const S3_BUCKET_URL = 'https://msi-resources-pages.s3.af-south-1.amazonaws.com/MSI%20PastPapers';  // The base URL for your S3 files
const OUTPUT_FILE = 'pastpapers_urls.json';  // Output file to save the metadata

// AWS S3 Client
const s3 = new AWS.S3();

// Keywords
const finalKeywords = ['september', 'sept', 'october', 'oct', 'november', 'nov', 'december', 'dec'];
const midyearKeywords = ['march', 'mar', 'april', 'apr', 'may', 'june', 'jun', 'july', 'jul', 'august', 'aug'];

// Helper Functions
const mapSubjectName = (folderName) => {
    const mapping = {
        "maths": "mathematics",
        "science": "science"
        // Add other mappings if needed
    };
    return mapping[folderName.toLowerCase()] || folderName.toLowerCase();
};

const detectGrade = (filename) => {
    const gradeMatch = filename.match(/grade\s*(10|11|12)/i);
    return gradeMatch ? gradeMatch[1] : "unknown";
};

const detectYear = (filename) => {
    const yearMatch = filename.match(/\b(20\d{2})\b/);
    return yearMatch ? yearMatch[1] : "unknown";
};

const detectExamType = (filename) => {
    const lowerFilename = filename.toLowerCase();
    if (finalKeywords.some(keyword => lowerFilename.includes(keyword))) return "final";
    if (midyearKeywords.some(keyword => lowerFilename.includes(keyword))) return "midyear";
    return "unknown";
};

const generateS3Url = (fileKey) => {
    return `${S3_BUCKET_URL}/${fileKey}`;
};

// Main Function to Scan S3 Bucket
const scanS3Bucket = async () => {
    try {
        const params = {
            Bucket: S3_BUCKET_NAME,
            Prefix: "MSI PastPapers/"  // The folder prefix where your papers are stored
        };

        const fileData = [];

        let data;
        do {
            // Fetch objects from the S3 bucket
            data = await s3.listObjectsV2(params).promise();

            // Process each file in the S3 bucket
            for (const obj of data.Contents) {
                const fileKey = obj.Key;
                const filename = path.basename(fileKey); // Get file name from the S3 key

                if (filename.match(/\.(pdf|docx|zip)$/i)) { // Process only relevant file types
                    // Extract subject, grade, year, and exam type from the file path
                    const pathParts = fileKey.split('/');
                    const subject = pathParts[2];  // Example: maths
                    const grade = pathParts[3].replace('grade', '');  // Example: 10 from grade10
                    const year = pathParts[4];  // Example: 2016
                    const examType = detectExamType(filename);

                    const url = generateS3Url(fileKey);

                    const dataEntry = {
                        title: `Grade ${grade} ${mapSubjectName(subject).charAt(0).toUpperCase() + mapSubjectName(subject).slice(1)} ${examType.charAt(0).toUpperCase() + examType.slice(1)} ${year}`,
                        url: url,
                        grade: grade,
                        subject: mapSubjectName(subject),
                        year: year,
                        examType: examType
                    };

                    fileData.push(dataEntry);
                }
            }

            // If there are more files, continue fetching them
            params.ContinuationToken = data.NextContinuationToken;
        } while (data.IsTruncated);  // Continue if there are more files

        // Save the data to a JSON file
        fs.writeFileSync(OUTPUT_FILE, JSON.stringify(fileData, null, 4));

        console.log(`✅ Done! Metadata saved at ${OUTPUT_FILE}`);
    } catch (err) {
        console.error("❌ Error: ", err);
    }
};

// Run the function
scanS3Bucket();
