const fs = require('fs');
const path = require('path');

// Root directory to scan (current directory)
const rootDir = process.cwd();

// S3 prefix
const s3Prefix = 'https://msi-resources-pages.s3.amazonaws.com/images/';

// Supported file extensions
const validExtensions = ['.js', '.jsx', '.ts', '.tsx', '.html'];

// Regex to match "/images/..." with case-insensitive extensions
const imageRegex = /(["'`])\/images\/([^"'`]+?\.(png|jpe?g|gif|svg|webp))\1/gi;

function replaceImagePaths(dir) {
  const files = fs.readdirSync(dir);

  for (const file of files) {
    const fullPath = path.join(dir, file);
    const stat = fs.statSync(fullPath);

    if (stat.isDirectory()) {
      replaceImagePaths(fullPath);
    } else if (validExtensions.includes(path.extname(file).toLowerCase())) {
      let content = fs.readFileSync(fullPath, 'utf8');

      const updated = content.replace(imageRegex, (_, quote, imagePath) => {
        return `${quote}${s3Prefix}${imagePath}${quote}`;
      });

      if (content !== updated) {
        fs.writeFileSync(fullPath, updated, 'utf8');
        console.log(`✅ Updated: ${fullPath}`);
      }
    }
  }
}

replaceImagePaths(rootDir);
console.log('✨ All done!');
