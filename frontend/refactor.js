import fs from 'fs';
import path from 'path';

function walkDir(dir, callback) {
  fs.readdirSync(dir).forEach(f => {
    let dirPath = path.join(dir, f);
    let isDirectory = fs.statSync(dirPath).isDirectory();
    isDirectory ? walkDir(dirPath, callback) : callback(path.join(dir, f));
  });
}

let updatedCount = 0;

walkDir('./src', function(filePath) {
  if (filePath.endsWith('.tsx') || filePath.endsWith('.ts')) {
    let content = fs.readFileSync(filePath, 'utf8');
    let original = content;

    // replace min-h-screen with min-h-[100dvh]
    content = content.replace(/\bmin-h-screen\b/g, 'min-h-[100dvh]');
    
    // replace h-screen with h-[100dvh]
    content = content.replace(/\bh-screen\b/g, 'h-[100dvh]');
    
    // replace w-96 with w-full max-w-96
    content = content.replace(/(?<!max-)w-96\b/g, 'w-full max-w-96');
    
    // replace w-80 with w-full max-w-80
    content = content.replace(/(?<!max-)w-80\b/g, 'w-full max-w-80');
    
    // replace w-72 with w-full max-w-72
    content = content.replace(/(?<!max-)w-72\b/g, 'w-full max-w-72');

    // replace w-[XXXpx] with w-full max-w-[XXXpx] if XXX >= 280
    content = content.replace(/(?<!max-)w-\[(\d+)px\]/g, (match, p1) => {
      let num = parseInt(p1, 10);
      if (num >= 280) {
        return `w-full max-w-[${num}px]`;
      }
      return match;
    });

    // Clean up duplicate w-full 
    content = content.replace(/w-full\s+w-full/g, 'w-full');

    if (content !== original) {
      fs.writeFileSync(filePath, content, 'utf8');
      console.log('Updated:', filePath);
      updatedCount++;
    }
  }
});

console.log(`\nFinished! Updated ${updatedCount} files.`);
