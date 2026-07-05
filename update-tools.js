const fs = require('fs');
const path = require('path');

const toolsPath = path.join(__dirname, 'data', 'tools.json');
const data = JSON.parse(fs.readFileSync(toolsPath, 'utf8'));

const newTool = {
  "id": "timezone-converter",
  "name": "Chrono / Timezone Converter",
  "shortDescription": "Visually synchronize and convert time across multiple global timezones.",
  "longDescription": "## Chrono / Timezone Converter\n\nA visual timezone converter and timeline slider designed to help developers and remote teams coordinate meetings and server deployment windows across the globe.\n\n### Features\n- Select and add multiple timezones to your dashboard\n- Interactive timeline scrubber to see synced local times\n- Highlight working hours (9 AM - 5 PM) to easily spot overlapping availability\n- Reset to current 'Now' time with a single click\n- 100% offline using native Intl API",
  "category": "utilities",
  "tags": [
    "time",
    "timezone",
    "converter",
    "utility",
    "world-clock",
    "timeline"
  ],
  "techStack": [
    "CSS3",
    "HTML5",
    "Vanilla JS",
    "Intl API"
  ],
  "difficulty": "Medium",
  "status": "live"
};

// Check if already exists
const exists = data.tools.find(t => t.id === newTool.id);
if (!exists) {
  data.tools.push(newTool);
  fs.writeFileSync(toolsPath, JSON.stringify(data, null, 2));
  console.log('Added timezone-converter to tools.json');
} else {
  console.log('timezone-converter already exists in tools.json');
}
