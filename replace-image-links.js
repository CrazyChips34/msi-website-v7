const fs = require('fs');
const path = require('path');

const oldUrl = 'https://d1dc40k4xbphr.cloudfront.net';
const newUrl = 'https://d1dc40k4xbphr.cloudfront.net';

const fileExtensions = ['.ts', '.tsx', '.js', '.jsx'];

function replaceInFile(filePath) {
  try {
    const content = fs.readFileSync(filePath, 'utf-8');
    if (content.includes(oldUrl)) {
      const updated = content.split(oldUrl).join(newUrl);
      fs.writeFileSync(filePath, updated, 'utf-8');
      console.log(`✔ Updated: ${filePath}`);
    }
  } catch (err) {
    console.error(`❌ Failed to read/replace in: ${filePath}\n`, err);
  }
}

function walkDir(dir) {
  const entries = fs.readdirSync(dir, { withFileTypes: true });

  for (const entry of entries) {
    const fullPath = path.join(dir, entry.name);

    if (entry.isDirectory()) {
      // Skip node_modules to avoid unnecessary work
      if (entry.name === 'node_modules') continue;
      walkDir(fullPath);
    } else if (fileExtensions.includes(path.extname(entry.name))) {
      replaceInFile(fullPath);
    }
  }
}

// Start from project root (current folder)
walkDir(process.cwd());
