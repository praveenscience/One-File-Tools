#!/usr/bin/env node

/**
 * Sync ReadMe.md "Available Tools" table with tools.json.
 *
 * Reads tools.json, generates the markdown table, and replaces
 * the section between the table header and the closing blockquote
 * in ReadMe.md. Zero external dependencies.
 *
 * Usage:
 *   node sync-readme.js
 *
 * Run this after merging PRs that add new tools.
 */

const fs = require("fs");
const path = require("path");

const toolsPath = path.join(__dirname, "tools.json");
const readmePath = path.join(__dirname, "ReadMe.md");

const data = JSON.parse(fs.readFileSync(toolsPath, "utf-8"));
const { site, categories, tools } = data;

// Build category name lookup
const catMap = {};
categories.forEach((c) => {
  catMap[c.id] = c.name;
});

// Only include live tools, sorted alphabetically by name
const liveTools = tools
  .filter((t) => t.status === "live")
  .sort((a, b) => a.name.localeCompare(b.name));

// Generate table rows
const rows = liveTools.map((t, i) => {
  const num = i + 1;
  const name = t.name;
  const file = `tools/${t.id}.html`;
  const category = catMap[t.category] || t.category;
  const desc = t.shortDescription;
  const live = `${site.url}/tools/${t.id}`;
  return `| ${num} | [${name}](${file}) | ${category} | ${desc} | [Try it](${live}) |`;
});

const table = `| # | Tool | Category | Description | Live |
|---|------|----------|-------------|------|
${rows.join("\n")}`;

// Read current ReadMe
let readme = fs.readFileSync(readmePath, "utf-8");

// Replace the table between "## Available Tools" and the blockquote after it
const tableStart = readme.indexOf("| # | Tool | Category |");
const tableEnd = readme.indexOf("\n\n> **Want to see your tool here?**");

if (tableStart === -1 || tableEnd === -1) {
  console.error("Could not find the Available Tools table markers in ReadMe.md");
  process.exit(1);
}

readme = readme.slice(0, tableStart) + table + readme.slice(tableEnd);

fs.writeFileSync(readmePath, readme, "utf-8");

console.log(`Synced ReadMe.md: ${liveTools.length} tools in the Available Tools table.`);
