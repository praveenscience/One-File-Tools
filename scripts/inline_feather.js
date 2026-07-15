const fs = require('fs');
const path = require('path');
const feather = require('feather-icons');

const files = [
  'tools/color-palette-extractor.html',
  'tools/git-ignore-generator.html',
  'tools/hreflang-tag-generator.html',
  'tools/image-metadata-viewer.html',
  'tools/password-generator.html',
  'tools/qr-code-generator.html',
];

const basePath = path.join(__dirname, '..');

files.forEach(file => {
  const filePath = path.join(basePath, file);
  if (!fs.existsSync(filePath)) {
    console.log(`File not found: ${filePath}`);
    return;
  }
  
  let content = fs.readFileSync(filePath, 'utf-8');
  
  // Replace all <i data-feather="icon-name" width="W" height="H"></i>
  // or <i data-feather="icon-name"></i>
  content = content.replace(/<i\s+data-feather="([^"]+)"\s*(?:width="([^"]+)")?\s*(?:height="([^"]+)")?\s*><\/i>/g, (match, iconName, width, height) => {
    if (feather.icons[iconName]) {
      const attrs = {
        width: width || '24',
        height: height || '24',
      };
      return feather.icons[iconName].toSvg(attrs);
    }
    console.log(`Icon not found: ${iconName} in ${file}`);
    return match;
  });
  
  // Also handle any other attributes (some might have class or style)
  content = content.replace(/<i([^>]*)data-feather="([^"]+)"([^>]*)><\/i>/g, (match, before, iconName, after) => {
    if (feather.icons[iconName]) {
      // Very basic extraction of width/height
      let width = '24', height = '24';
      const wMatch = match.match(/width="([^"]+)"/);
      if (wMatch) width = wMatch[1];
      const hMatch = match.match(/height="([^"]+)"/);
      if (hMatch) height = hMatch[1];
      
      const attrs = { width, height };
      return feather.icons[iconName].toSvg(attrs);
    }
    return match;
  });

  // Remove feather CDN script
  content = content.replace(/<script src="https:\/\/unpkg\.com\/feather-icons"><\/script>\r?\n?/g, '');
  // Remove feather.replace()
  content = content.replace(/feather\.replace\(\);?\r?\n?/g, '');
  
  fs.writeFileSync(filePath, content, 'utf-8');
  console.log(`Processed ${file}`);
});
