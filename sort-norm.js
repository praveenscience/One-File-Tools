const fs = require("fs");
const path = require("path");

const TAG_ALIASES = {
  js: "javascript",
  javascript: "javascript",
  "vanilla-js": "javascript",
  "vanilla-javascript": "javascript",

  html5: "html",
  css3: "css",

  og: "open-graph",
  "og-tags": "open-graph",

  generators: "generator",
  validators: "validator",
  analyzers: "analyzer",
  formatters: "formatter",
  converters: "converter",
  calculators: "calculator",

  uuids: "uuid",

  developer: "developer-tools",
  "developer-tool": "developer-tools"
};

function normalizeTag(tag) {
  const key = tag.trim().toLowerCase();
  return TAG_ALIASES[key] || key;
}

const file = process.argv[2];

if (!file) {
  console.error("Usage: sort-norm <file.json>");
  process.exit(1);
}

const data = JSON.parse(fs.readFileSync(path.resolve(file), "utf8"));

// Sort categories
if (Array.isArray(data.categories)) {
  data.categories.sort((a, b) => a.name.localeCompare(b.name));
}

// Normalize and sort tools
if (Array.isArray(data.tools)) {
  data.tools.sort((a, b) => a.name.localeCompare(b.name));

  for (const tool of data.tools) {
    if (Array.isArray(tool.tags)) {
      tool.tags = [...new Set(tool.tags.map(normalizeTag))].sort((a, b) => a.localeCompare(b));
    }

    if (Array.isArray(tool.techStack)) {
      tool.techStack.sort((a, b) => a.localeCompare(b));
    }
  }
}

fs.writeFileSync(file, JSON.stringify(data, null, 2) + "\n", "utf8");

console.log(`✓ Normalized and sorted: ${file}`);
