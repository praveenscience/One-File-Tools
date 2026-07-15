const fs = require("fs");
const path = require("path");

const toolsJsonPath = path.join(__dirname, "../data/tools.json");
const toolsDir = path.join(__dirname, "../tools");

const toolsData = JSON.parse(fs.readFileSync(toolsJsonPath, "utf-8"));

let updatedCount = 0;

toolsData.tools.forEach((tool) => {
  const fileName = tool.id + ".html";
  const filePath = path.join(toolsDir, fileName);
  
  if (fs.existsSync(filePath)) {
    let content = fs.readFileSync(filePath, "utf-8");
    
    // Check if meta description already exists
    if (!content.includes('<meta name="description"')) {
      // Find the <head> or <title> tag to inject the meta tag
      const descText = tool.shortDescription || tool.name;
      const descriptionTag = `    <meta name="description" content="${descText.replace(/"/g, '&quot;')}">`;
      
      let changed = false;
      if (content.includes("</title>")) {
        content = content.replace("</title>", "</title>\n" + descriptionTag);
        changed = true;
      } else if (content.includes("<head>")) {
        content = content.replace("<head>", "<head>\n" + descriptionTag);
        changed = true;
      }
      
      if (changed) {
        fs.writeFileSync(filePath, content, "utf-8");
        updatedCount++;
      }
    }
  } else {
    // console.log(`File not found: ${filePath}`);
  }
});

console.log(`Successfully added meta description to ${updatedCount} tools.`);
