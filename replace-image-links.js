const fs = require('fs');
const path = require('path');

// Change these to your actual URLs
const oldUrl = 'https://d1dc40k4xbphr.cloudfront.net';
const newUrl = 'https://d1dc40k4xbphr.cloudfront.net';

// File types to search through
const fileExtensions = ['.tsx', '.ts', '.js', '.jsx'];

function replaceInFile(filePath) {
  const content = fs.readFileSync(filePath, 'utf-8');
  if (content.includes(oldUrl)) {
    const updated = content.replaceAll(oldUrl, newUrl);
    fs.writeFileSync(filePath, updated, 'utf-8');
    console.log(`✔ Updated: ${filePath}`);
  }
}

function walkDir(dir) {
  const files = fs.readdirSync(dir);
  for (const file of files) {
    const fullPath = path.join(dir, file);
    const stats = fs.statSync(fullPath);
    if (stats.isDirectory()) {
      walkDir(fullPath);
    } else if (fileExtensions.includes(path.extname(fullPath))) {
      replaceInFile(fullPath);
    }
  }
}

// Start from the current directory
walkDir('./');
