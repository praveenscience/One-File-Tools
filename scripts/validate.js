#!/usr/bin/env node

/**
 * Validates data consistency across tools, quests, and quizzes.
 * Checks for missing files, bad categories, duplicates, orphans, fake screenshots, and case mismatches.
 *
 * Usage: node scripts/validate.js
 */

const fs = require("fs");
const path = require("path");

const rootDir = path.join(__dirname, "..");
const issues = [];

function check(dir, jsonFile, key, label) {
  const dataPath = path.join(rootDir, "data", jsonFile);
  if (!fs.existsSync(dataPath)) {
    console.log(`${label}: ${jsonFile} not found, skipping.`);
    return;
  }
  const data = JSON.parse(fs.readFileSync(dataPath, "utf-8"));
  const categories = (data.categories || []).map((c) => c.id);
  const items = data[key] || [];
  const ids = items.map((t) => t.id);

  // Duplicate IDs
  const dupes = ids.filter((id, i) => ids.indexOf(id) !== i);
  if (dupes.length) issues.push(`DUPLICATE ${label} IDS: ${dupes.join(", ")}`);

  // Missing files + bad categories
  items.forEach((t) => {
    if (!fs.existsSync(path.join(rootDir, dir, t.id + ".html")))
      issues.push(`MISSING HTML: ${dir}/${t.id}.html`);
    if (!fs.existsSync(path.join(rootDir, dir, t.id + ".png")))
      issues.push(`MISSING PNG: ${dir}/${t.id}.png`);
    if (categories.length && !categories.includes(t.category))
      issues.push(`BAD CATEGORY: ${t.id} -> ${t.category}`);

    // Required fields
    const required = ["id", "name", "shortDescription", "longDescription", "category", "tags", "techStack", "difficulty", "status"];
    required.forEach((f) => {
      if (t[f] === undefined || t[f] === null) issues.push(`MISSING FIELD: ${t.id}.${f}`);
    });
  });

  // Orphan HTML
  const dirPath = path.join(rootDir, dir);
  if (fs.existsSync(dirPath)) {
    fs.readdirSync(dirPath)
      .filter((f) => f.endsWith(".html"))
      .forEach((f) => {
        const id = f.replace(".html", "");
        if (!items.some((t) => t.id === id)) issues.push(`ORPHAN: ${dir}/${f}`);
      });

    // Case-mismatch PNGs
    fs.readdirSync(dirPath)
      .filter((f) => f.endsWith(".png"))
      .forEach((f) => {
        if (f !== f.toLowerCase()) issues.push(`CASE MISMATCH PNG: ${dir}/${f}`);
      });

    // Suspect screenshots
    fs.readdirSync(dirPath)
      .filter((f) => f.endsWith(".png"))
      .forEach((f) => {
        const stat = fs.statSync(path.join(dirPath, f));
        if (stat.size < 500) issues.push(`FAKE PNG: ${dir}/${f} (${stat.size} bytes)`);
      });
  }

  console.log(`  ${items.length} ${label.toLowerCase()}`);
}

console.log("Validating One File Tools...\n");
check("tools", "tools.json", "tools", "Tools");
check("quests", "quests.json", "quests", "Quests");
check("quizzes", "quizzes.json", "quizzes", "Quizzes");

console.log("");
if (issues.length === 0) {
  console.log("All clean. No issues found.");
} else {
  console.log(`${issues.length} issue(s) found:\n`);
  issues.forEach((i) => console.log("  " + i));
}

process.exit(issues.length > 0 ? 1 : 0);
