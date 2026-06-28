#!/usr/bin/env node

/**
 * Build script for One File Tools.
 *
 * Reads tools.json and generates index.html with 5 switchable design layouts.
 * Zero npm dependencies - runs with plain Node.js.
 *
 * Usage:
 *   node build.js
 *
 * Cloudflare Pages build command:
 *   node build.js
 */

const fs = require("fs");
const path = require("path");

// ──────────────────────────────────────────────
// Load data
// ──────────────────────────────────────────────

const data = JSON.parse(fs.readFileSync(path.join(__dirname, "tools.json"), "utf-8"));
const { site, categories, tools } = data;

// ──────────────────────────────────────────────
// Helpers
// ──────────────────────────────────────────────

function escapeHtml(str) {
  return String(str).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;").replace(/'/g, "&#39;");
}

function escapeAttr(str) {
  return escapeHtml(str);
}

/**
 * Minimal Markdown-to-HTML converter.
 */
function markdownToHtml(md) {
  if (!md) return "";
  const lines = md.split("\n");
  let html = "";
  let inCodeBlock = false;
  let inList = false;
  let listType = "";
  let paragraph = [];

  function flushParagraph() {
    if (paragraph.length > 0) {
      html += "<p>" + inlineMarkdown(paragraph.join(" ")) + "</p>\n";
      paragraph = [];
    }
  }

  function closeList() {
    if (inList) {
      html += listType === "ul" ? "</ul>\n" : "</ol>\n";
      inList = false;
      listType = "";
    }
  }

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    if (line.trimStart().startsWith("```")) {
      if (!inCodeBlock) {
        flushParagraph();
        closeList();
        inCodeBlock = true;
        html += "<pre><code>";
      } else {
        inCodeBlock = false;
        html += "</code></pre>\n";
      }
      continue;
    }
    if (inCodeBlock) {
      html += escapeHtml(line) + "\n";
      continue;
    }
    const trimmed = line.trim();
    if (trimmed === "") {
      flushParagraph();
      closeList();
      continue;
    }
    const headerMatch = trimmed.match(/^(#{1,6})\s+(.+)$/);
    if (headerMatch) {
      flushParagraph();
      closeList();
      const level = headerMatch[1].length;
      html += `<h${level}>${inlineMarkdown(headerMatch[2])}</h${level}>\n`;
      continue;
    }
    if (trimmed.match(/^[-*+]\s+/)) {
      flushParagraph();
      if (!inList || listType !== "ul") {
        closeList();
        html += "<ul>\n";
        inList = true;
        listType = "ul";
      }
      html += "<li>" + inlineMarkdown(trimmed.replace(/^[-*+]\s+/, "")) + "</li>\n";
      continue;
    }
    if (trimmed.match(/^\d+\.\s+/)) {
      flushParagraph();
      if (!inList || listType !== "ol") {
        closeList();
        html += "<ol>\n";
        inList = true;
        listType = "ol";
      }
      html += "<li>" + inlineMarkdown(trimmed.replace(/^\d+\.\s+/, "")) + "</li>\n";
      continue;
    }
    paragraph.push(trimmed);
  }
  flushParagraph();
  closeList();
  if (inCodeBlock) html += "</code></pre>\n";
  return html;
}

function inlineMarkdown(text) {
  return escapeHtml(text)
    .replace(/`([^`]+)`/g, "<code>$1</code>")
    .replace(/\*\*([^*]+)\*\*/g, "<strong>$1</strong>")
    .replace(/\*([^*]+)\*/g, "<em>$1</em>")
    .replace(/\[([^\]]+)\]\(([^)]+)\)/g, '<a href="$2" target="_blank" rel="noopener">$1</a>');
}

function thumbnailExists(toolId) {
  return fs.existsSync(path.join(__dirname, "tools", toolId + ".png"));
}

// ──────────────────────────────────────────────
// Build tool data
// ──────────────────────────────────────────────

const categoryMap = {};
categories.forEach((c) => {
  categoryMap[c.id] = c;
});

const toolsData = tools.map((tool) => ({
  id: tool.id,
  name: tool.name,
  shortDescription: tool.shortDescription,
  longDescriptionHtml: markdownToHtml(tool.longDescription),
  category: tool.category,
  categoryName: categoryMap[tool.category]?.name || tool.category,
  categoryIcon: categoryMap[tool.category]?.icon || "",
  tags: tool.tags || [],
  techStack: tool.techStack || [],
  difficulty: tool.difficulty || "Easy",
  status: tool.status || "idea",
  hasThumbnail: thumbnailExists(tool.id),
  file: `tools/${tool.id}.html`,
  thumbnail: `tools/${tool.id}.png`,
  github: `${site.github}/blob/main/tools/${tool.id}.html`,
  live: `${site.url}/tools/${tool.id}`
}));

// Group tools by category
const toolsByCategory = {};
categories.forEach((c) => {
  toolsByCategory[c.id] = toolsData.filter((t) => t.category === c.id);
});

const liveCount = tools.filter((t) => t.status === "live").length;
const totalCount = tools.length;

// Collect all unique tags across all tools
const allTags = [...new Set(tools.flatMap((t) => t.tags || []))].sort();

// ──────────────────────────────────────────────
// Template-based index.html generation
// ──────────────────────────────────────────────

// ──────────────────────────────────────────────
// Read template & generate static HTML
// ──────────────────────────────────────────────

const templatePath = path.join(__dirname, "index-template.txt");
const template = fs.readFileSync(templatePath, "utf-8");

// Count tools by category for pill labels
const countByCategory = {};
categories.forEach((c) => { countByCategory[c.id] = 0; });
toolsData.forEach((t) => { if (countByCategory[t.category] !== undefined) countByCategory[t.category]++; });

// ── Build pillar cards (static HTML) ──

function buildPillarCards() {
  const pillars = [
    {
      id: "tools",
      title: "One File Tools",
      count: totalCount + " tools and counting",
      desc: "CSS generators, JSON utilities, SEO helpers, and more.",
      icon: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M14.7 6.3a4 4 0 0 0-5.4 5.4L3 18v3h3l6.3-6.3a4 4 0 0 0 5.4-5.4l-2.6 2.6-2.1-.4-.4-2.1z"/></svg>'
    },
    {
      id: "resume",
      title: "One File Resume",
      count: "1 theme",
      desc: "ATS-friendly resume themes from a single JSON file. Zero JS, A4 print-ready.",
      icon: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><path d="M14 2v6h6M9 13h6M9 17h4"/></svg>'
    },
    {
      id: "portfolio",
      title: "One File Portfolio",
      count: "1 theme",
      desc: "Developer portfolio themes from a single JSON file. Dark/light, responsive.",
      icon: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="4" width="18" height="16" rx="2"/><path d="M3 9h18M7 6.5h.01M10 6.5h.01"/></svg>'
    },
    {
      id: "soon",
      title: "More coming soon\u2026",
      count: "Contribute on GitHub",
      desc: "New pillars and ideas are always welcome.",
      muted: true,
      icon: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 3v3M12 18v3M3 12h3M18 12h3M5.6 5.6l2.1 2.1M16.3 16.3l2.1 2.1M5.6 18.4l2.1-2.1M16.3 7.7l2.1-2.1"/></svg>'
    }
  ];

  return pillars.map((p) => {
    if (p.muted) {
      return '          <div class="pillar is-muted" aria-disabled="true">' +
        '<span class="p-icon" aria-hidden="true">' + p.icon + '</span>' +
        '<h3>' + escapeHtml(p.title) + '</h3>' +
        '<p>' + escapeHtml(p.desc) + ' Contribute on GitHub!</p>' +
        '<span class="p-count">' + escapeHtml(p.count) + '</span></div>';
    }
    const pressed = p.id === "tools" ? "true" : "false";
    return '          <button class="pillar" type="button" data-pillar="' + escapeAttr(p.id) + '" aria-pressed="' + pressed + '">' +
      '<span class="p-icon" aria-hidden="true">' + p.icon + '</span>' +
      '<h3>' + escapeHtml(p.title) + '</h3>' +
      '<p>' + escapeHtml(p.desc) + '</p>' +
      '<span class="p-count">' + escapeHtml(p.count) + '</span></button>';
  }).join("\n");
}

// ── Build filter pills (static HTML) ──

function buildFilterPills() {
  const pills = ['              <button class="pill" type="button" data-cat="all" aria-pressed="true"><span class="pi" aria-hidden="true">\u25A6</span> All <span class="pill-count">(' + totalCount + ')</span></button>'];
  categories.forEach((c) => {
    const count = countByCategory[c.id] || 0;
    if (count === 0) return;
    pills.push('              <button class="pill" type="button" data-cat="' + escapeAttr(c.id) + '" aria-pressed="false"><span class="pi" aria-hidden="true">' + c.icon + '</span> ' + escapeHtml(c.name) + ' <span class="pill-count">(' + count + ')</span></button>');
  });
  return pills.join("\n");
}

// ── Build tool cards (static HTML) ──

function buildToolCards() {
  return toolsData.map((t) => {
    const cat = categoryMap[t.category];
    const diff = t.difficulty.toLowerCase();
    const searchData = (t.name + " " + t.shortDescription + " " + t.tags.join(" ")).toLowerCase();
    const liveUrl = site.url + "/tools/" + t.id;

    const thumbHtml = t.hasThumbnail
      ? '<img class="card-thumb" src="tools/' + escapeAttr(t.id) + '.png" alt="' + escapeAttr(t.name) + '" loading="lazy" />'
      : '<div class="card-thumb-placeholder">' + (cat ? cat.icon : '') + '</div>';

    return '            <article class="card" data-id="' + escapeAttr(t.id) + '" data-category="' + escapeAttr(t.category) + '" data-search="' + escapeAttr(searchData) + '" tabindex="0" role="button" aria-label="View details for ' + escapeAttr(t.name) + '">' +
      thumbHtml +
      '<div class="card-body">' +
      '<div class="card-top"><h4>' + escapeHtml(t.name) + '</h4>' +
      '<span class="badge-cat"><span aria-hidden="true">' + (cat ? cat.icon : '') + '</span> ' + escapeHtml(t.categoryName) + '</span></div>' +
      '<p class="desc">' + escapeHtml(t.shortDescription) + '</p>' +
      '<div class="path mono">tools/' + escapeHtml(t.id) + '.html</div>' +
      '<div class="card-foot">' +
      '<span class="badge-diff ' + diff + '">' + escapeHtml(t.difficulty) + '</span>' +
      '<span class="card-links">' +
      '<a class="link-btn" href="tools/' + escapeAttr(t.id) + '.html" data-nomodal>Open</a>' +
      '<a class="link-btn primary" href="' + escapeAttr(liveUrl) + '" target="_blank" rel="noopener noreferrer" data-nomodal>Live <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M7 17 17 7M9 7h8v8"/></svg></a>' +
      '</span></div></div></article>';
  }).join("\n");
}

// ── Build resume/portfolio showcase cards (static HTML) ──

function buildResumeCards() {
  const glyph = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><path d="M14 2v6h6M9 13h6M9 17h4"/></svg>';
  return resumeThemes.map((t) =>
    '            <article class="theme-card">' +
    '<div class="tc-head"><span class="tc-glyph" aria-hidden="true">' + glyph + '</span><h4>' + escapeHtml(t.name) + '</h4></div>' +
    '<div class="path mono">' + escapeHtml(t.file) + '</div>' +
    '<p>' + escapeHtml(t.description) + '</p>' +
    '<a class="preview-btn" href="' + escapeAttr(t.file) + '" target="_blank" rel="noopener noreferrer">Preview <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="M7 17 17 7M9 7h8v8"/></svg></a>' +
    '</article>'
  ).join("\n");
}

function buildPortfolioCards() {
  const glyph = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="4" width="18" height="16" rx="2"/><path d="M3 9h18"/></svg>';
  return portfolioThemes.map((t) =>
    '            <article class="theme-card">' +
    '<div class="tc-head"><span class="tc-glyph" aria-hidden="true">' + glyph + '</span><h4>' + escapeHtml(t.name) + '</h4></div>' +
    '<div class="path mono">' + escapeHtml(t.file) + '</div>' +
    '<p>' + escapeHtml(t.description) + '</p>' +
    '<a class="preview-btn" href="' + escapeAttr(t.file) + '" target="_blank" rel="noopener noreferrer">Preview <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="M7 17 17 7M9 7h8v8"/></svg></a>' +
    '</article>'
  ).join("\n");
}

// Resume & portfolio theme data for the template
const resumeThemes = [
  { id: "classic", name: "Classic", description: "Clean single-column layout. ATS-compliant, zero JavaScript, A4 print-ready. System fonts only.", file: "resume/themes/classic.html" }
];
const portfolioThemes = [
  { id: "developer", name: "Developer", description: "Terminal/IDE aesthetic with JetBrains Mono, dark/light mode toggle, IntersectionObserver animations, 20+ inline SVG icons.", file: "portfolio/themes/developer.html" }
];

// Build JSON data for the script block (used by modal + search)
const siteJson = JSON.stringify({ title: site.title, tagline: site.tagline, url: site.url, github: site.github });
const categoriesJson = JSON.stringify(categories.map((c) => ({ id: c.id, name: c.name, icon: c.icon })));
const toolsJson = JSON.stringify(toolsData.map((t) => ({
  id: t.id, name: t.name, shortDescription: t.shortDescription, longDescription: tools.find((x) => x.id === t.id)?.longDescription || "",
  category: t.category, tags: t.tags, techStack: t.techStack, difficulty: t.difficulty
})));
const resumeThemesJson = JSON.stringify(resumeThemes);
const portfolioThemesJson = JSON.stringify(portfolioThemes);

// ── Inject into template ──

let html = template
  .replace(/\{\{SITE_URL\}\}/g, escapeAttr(site.url))
  .replace(/\{\{GITHUB_URL\}\}/g, escapeAttr(site.github))
  .replace(/\{\{AUTHOR_URL\}\}/g, escapeAttr(site.author.url))
  .replace(/\{\{AUTHOR_NAME\}\}/g, escapeHtml(site.author.name))
  .replace(/\{\{SSOC_URL\}\}/g, escapeAttr(site.ssoc.url))
  .replace(/\{\{YEAR\}\}/g, new Date().getFullYear().toString())
  .replace(/\{\{TOOL_COUNT\}\}/g, String(totalCount))
  .replace("{{PILLAR_CARDS}}", buildPillarCards())
  .replace("{{FILTER_PILLS}}", buildFilterPills())
  .replace("{{TOOL_CARDS}}", buildToolCards())
  .replace("{{RESUME_CARDS}}", buildResumeCards())
  .replace("{{PORTFOLIO_CARDS}}", buildPortfolioCards())
  .replace("{{SITE_JSON}}", siteJson)
  .replace("{{CATEGORIES_JSON}}", categoriesJson)
  .replace("{{TOOLS_JSON}}", toolsJson)
  .replace("{{RESUME_THEMES_JSON}}", resumeThemesJson)
  .replace("{{PORTFOLIO_THEMES_JSON}}", portfolioThemesJson);

// ──────────────────────────────────────────────
// Write output
// ──────────────────────────────────────────────

const outPath = path.join(__dirname, "index.html");
fs.writeFileSync(outPath, html, "utf-8");

console.log("Built index.html successfully.");
console.log("  " + totalCount + " tools across " + categories.length + " categories (" + liveCount + " live, " + (totalCount - liveCount) + " ideas)");
console.log("  Template: " + templatePath);
console.log("  Output: " + outPath);

// ──────────────────────────────────────────────
// Load profile data (for resume & portfolio generation)
// ──────────────────────────────────────────────

const profilePath = path.join(__dirname, "profile.json");
let profile = null;
try {
  profile = JSON.parse(fs.readFileSync(profilePath, "utf-8"));
} catch (err) {
  if (err.code !== "ENOENT") {
    console.error("Warning: Could not parse profile.json — " + err.message);
  }
}

if (profile) {

  // ── Shared helpers for resume & portfolio themes ──

  function has(v) {
    if (v == null) return false;
    if (Array.isArray(v)) return v.length > 0;
    if (typeof v === "string") return v.trim().length > 0;
    if (typeof v === "object") return Object.keys(v).length > 0;
    return true;
  }

  function fmtDate(d) {
    if (!d) return "Present";
    const parts = String(d).split("-");
    if (parts.length === 1) return parts[0];
    const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
    return months[parseInt(parts[1], 10) - 1] + " " + parts[0];
  }

  function isoDate(d) { return d ? String(d) : ""; }

  // ── Resume theme: Classic ──

  function buildResumeClassic(profile) {
    const p = profile.personal || {};
    const contact = p.contact || {};
    const location = p.location || {};
    const social = p.social || {};
    const skills = profile.skills || [];
    const experience = profile.experience || [];
    const education = profile.education || [];
    const certifications = profile.certifications || [];
    const publications = profile.publications || [];
    const languages = profile.languages || [];
    const volunteer = profile.volunteer || [];
    const projects = profile.projects || [];
    const summary = profile.summary || "";

    const e = escapeHtml;

    const displayName = p.displayName || [p.firstName, p.lastName].filter(Boolean).join(" ") || "Your Name";
    const title = p.title || "";

    const locationParts = [location.city, location.state, location.country].filter(Boolean);
    const locationStr = locationParts.join(", ");

    // Contact line items
    const contactItems = [];
    if (has(contact.email)) contactItems.push(`<a href="mailto:${e(contact.email)}">${e(contact.email)}</a>`);
    if (has(contact.phone)) contactItems.push(e(contact.phone));
    if (has(contact.website)) contactItems.push(`<a href="${e(contact.website)}">${e(contact.website.replace(/^https?:\/\//, ""))}</a>`);
    if (has(social.linkedin)) contactItems.push(`<a href="${e(social.linkedin)}">LinkedIn</a>`);
    if (has(social.github)) contactItems.push(`<a href="${e(social.github)}">GitHub</a>`);
    if (has(locationStr)) contactItems.push(e(locationStr));

    return `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>${e(displayName)} — Resume</title>
<style>
@page { size: A4; margin: 15mm 20mm; }

*, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }

body {
  font-family: "Segoe UI", -apple-system, BlinkMacSystemFont, Roboto, "Helvetica Neue", Arial, sans-serif;
  font-size: 10.5pt;
  line-height: 1.5;
  color: #1a1a1a;
  background: #f5f5f5;
}

.page {
  max-width: 210mm;
  margin: 2rem auto;
  background: #fff;
  padding: 40px 48px;
  box-shadow: 0 2px 20px rgba(0,0,0,0.1);
}

/* ── Header ──────────────────────────── */
header { text-align: center; margin-bottom: 20px; padding-bottom: 16px; border-bottom: 2px solid #2563eb; }
h1 { font-size: 22pt; font-weight: 700; color: #111; letter-spacing: -0.02em; margin-bottom: 2px; }
.title { font-size: 11pt; color: #2563eb; font-weight: 500; margin-bottom: 8px; }
.contact-line { font-size: 9pt; color: #555; display: flex; justify-content: center; flex-wrap: wrap; gap: 4px 16px; }
.contact-line a { color: #2563eb; text-decoration: none; }

/* ── Sections ────────────────────────── */
section { margin-bottom: 18px; }
h2 {
  font-size: 11pt; font-weight: 700; text-transform: uppercase;
  letter-spacing: 0.08em; color: #2563eb;
  border-bottom: 1px solid #d1d5db; padding-bottom: 3px; margin-bottom: 10px;
}
h3 { font-size: 10.5pt; font-weight: 600; color: #111; }
.meta { font-size: 9pt; color: #666; margin-bottom: 4px; }
.description { font-size: 10pt; color: #333; margin-bottom: 4px; }
ul { padding-left: 18px; margin-bottom: 8px; }
li { font-size: 10pt; color: #333; margin-bottom: 2px; }

/* ── Experience & Education entries ─── */
.entry { margin-bottom: 14px; }
.entry-header { display: flex; justify-content: space-between; align-items: baseline; flex-wrap: wrap; gap: 4px; }
.entry-header h3 { flex: 1; }
.entry-header .dates { font-size: 9pt; color: #666; white-space: nowrap; }
.company { font-size: 10pt; color: #444; font-weight: 500; }
.entry-location { font-size: 9pt; color: #888; }

/* ── Skills ───────────────────────────── */
.skills-section { display: grid; grid-template-columns: 1fr 1fr; gap: 8px 24px; }
.skill-category { margin-bottom: 6px; }
.skill-category h3 { font-size: 9.5pt; color: #2563eb; font-weight: 600; margin-bottom: 2px; }
.skill-list { font-size: 10pt; color: #333; }

/* ── Certifications ──────────────────── */
.cert-item { margin-bottom: 6px; }
.cert-item .cert-name { font-weight: 600; font-size: 10pt; }
.cert-item .cert-meta { font-size: 9pt; color: #666; }

/* ── Languages ───────────────────────── */
.lang-list { display: flex; gap: 16px; flex-wrap: wrap; font-size: 10pt; }
.lang-item .lang-name { font-weight: 600; }
.lang-item .lang-level { color: #666; font-size: 9pt; }

/* ── Publications ────────────────────── */
.pub-item { margin-bottom: 6px; font-size: 10pt; }
.pub-item a { color: #2563eb; text-decoration: none; }
.pub-meta { font-size: 9pt; color: #666; }

/* ── Responsive (screen) ─────────────── */
@media screen and (max-width: 700px) {
  .page { margin: 0; padding: 24px 20px; box-shadow: none; }
  .skills-section { grid-template-columns: 1fr; }
  .entry-header { flex-direction: column; }
}

/* ── Print ────────────────────────────── */
@media print {
  body { background: #fff; font-size: 10pt; }
  .page { margin: 0; padding: 0; box-shadow: none; max-width: none; }
  a { color: #000; text-decoration: none; }
  header { border-bottom-color: #000; }
  h2 { color: #000; border-bottom-color: #999; }
  .title { color: #333; }
  .contact-line a { color: #333; }
  h2 { break-after: avoid; }
  .entry { break-inside: avoid; }
  section { break-inside: avoid; }
}
</style>
</head>
<body>
<div class="page">

<header>
  <h1>${e(displayName)}</h1>
  ${has(title) ? `<div class="title">${e(title)}</div>` : ""}
  ${contactItems.length > 0 ? `<div class="contact-line">${contactItems.join('<span aria-hidden="true"> | </span>')}</div>` : ""}
</header>

${has(summary) ? `<section>
  <h2>Summary</h2>
  <p class="description">${e(summary)}</p>
</section>` : ""}

${has(experience) ? `<section>
  <h2>Experience</h2>
  ${experience.map((exp) => `<div class="entry">
    <div class="entry-header">
      <h3>${e(exp.role)}</h3>
      <span class="dates"><time datetime="${isoDate(exp.startDate)}">${fmtDate(exp.startDate)}</time> — ${exp.current ? "Present" : `<time datetime="${isoDate(exp.endDate)}">${fmtDate(exp.endDate)}</time>`}</span>
    </div>
    <div class="company">${e(exp.company)}${has(exp.location) ? ` <span class="entry-location">| ${e(exp.location)}</span>` : ""}</div>
    ${has(exp.description) ? `<p class="description">${e(exp.description)}</p>` : ""}
    ${has(exp.highlights) ? `<ul>${exp.highlights.map((h) => `<li>${e(h)}</li>`).join("")}</ul>` : ""}
  </div>`).join("")}
</section>` : ""}

${has(education) ? `<section>
  <h2>Education</h2>
  ${education.map((edu) => `<div class="entry">
    <div class="entry-header">
      <h3>${e(edu.degree)}${has(edu.field) ? ` in ${e(edu.field)}` : ""}</h3>
      <span class="dates">${has(edu.startDate) ? `<time datetime="${isoDate(edu.startDate)}">${fmtDate(edu.startDate)}</time>` : ""}${has(edu.endDate) ? ` — <time datetime="${isoDate(edu.endDate)}">${fmtDate(edu.endDate)}</time>` : ""}</span>
    </div>
    <div class="company">${e(edu.institution)}${has(edu.gpa) ? ` | GPA: ${e(edu.gpa)}` : ""}</div>
    ${has(edu.honors) ? `<ul>${edu.honors.map((h) => `<li>${e(h)}</li>`).join("")}</ul>` : ""}
  </div>`).join("")}
</section>` : ""}

${has(skills) ? `<section>
  <h2>Skills</h2>
  <div class="skills-section">
    ${skills.filter((g) => has(g.items)).map((group) => `<div class="skill-category">
      <h3>${e(group.category)}</h3>
      <div class="skill-list">${group.items.map((i) => e(i.name)).join(", ")}</div>
    </div>`).join("")}
  </div>
</section>` : ""}

${has(projects) ? `<section>
  <h2>Projects</h2>
  ${projects.filter((pr) => pr.featured).map((proj) => `<div class="entry">
    <div class="entry-header">
      <h3>${e(proj.name)}${has(proj.tagline) ? ` — ${e(proj.tagline)}` : ""}</h3>
      ${has(proj.year) ? `<span class="dates">${e(String(proj.year))}</span>` : ""}
    </div>
    ${has(proj.description) ? `<p class="description">${e(proj.description)}</p>` : ""}
    ${has(proj.highlights) ? `<ul>${proj.highlights.map((h) => `<li>${e(h)}</li>`).join("")}</ul>` : ""}
  </div>`).join("")}
</section>` : ""}

${has(certifications) ? `<section>
  <h2>Certifications</h2>
  ${certifications.map((cert) => `<div class="cert-item">
    <span class="cert-name">${e(cert.name)}</span>
    <span class="cert-meta"> — ${e(cert.issuer)}, <time datetime="${isoDate(cert.date)}">${fmtDate(cert.date)}</time></span>
  </div>`).join("")}
</section>` : ""}

${has(publications) ? `<section>
  <h2>Publications</h2>
  ${publications.map((pub) => `<div class="pub-item">
    ${has(pub.url) ? `<a href="${e(pub.url)}">${e(pub.title)}</a>` : e(pub.title)}
    <span class="pub-meta"> — ${e(pub.publisher)}, <time datetime="${isoDate(pub.date)}">${fmtDate(pub.date)}</time></span>
  </div>`).join("")}
</section>` : ""}

${has(languages) ? `<section>
  <h2>Languages</h2>
  <div class="lang-list">
    ${languages.map((lang) => `<span class="lang-item"><span class="lang-name">${e(lang.language)}</span> <span class="lang-level">(${e(lang.proficiency)})</span></span>`).join("")}
  </div>
</section>` : ""}

${has(volunteer) ? `<section>
  <h2>Volunteer</h2>
  ${volunteer.map((vol) => `<div class="entry">
    <div class="entry-header">
      <h3>${e(vol.role)}</h3>
      <span class="dates"><time datetime="${isoDate(vol.startDate)}">${fmtDate(vol.startDate)}</time> — ${vol.current ? "Present" : `<time datetime="${isoDate(vol.endDate)}">${fmtDate(vol.endDate)}</time>`}</span>
    </div>
    <div class="company">${e(vol.organization)}</div>
    ${has(vol.description) ? `<p class="description">${e(vol.description)}</p>` : ""}
  </div>`).join("")}
</section>` : ""}

</div>
<footer style="text-align:center;padding:1.5rem;font-size:8pt;color:#999;border-top:1px solid #e5e7eb;margin-top:1rem">
  <p>Built with <a href="https://github.com/praveenscience/One-File-Tools" style="color:#2563eb;text-decoration:none">One File Tools</a></p>
</footer>
</body>
</html>`;
  }

  // ── Portfolio theme: Developer ──

  function buildPortfolioDeveloper(profile) {
    const p = profile.personal || {};
    const social = p.social || {};
    const contact = p.contact || {};
    const location = p.location || {};
    const skills = profile.skills || [];
    const projects = profile.projects || [];
    const experience = profile.experience || [];
    const education = profile.education || [];
    const talks = profile.talks || [];
    const publications = profile.publications || [];
    const summary = profile.summary || "";
    const bio = p.bio || "";

    const e = escapeHtml;

    function socialLinks() {
      const map = {
        github: { label: "GitHub", icon: "github" },
        linkedin: { label: "LinkedIn", icon: "linkedin" },
        twitter: { label: "Twitter / X", icon: "twitter" },
        youtube: { label: "YouTube", icon: "youtube" },
        blog: { label: "Blog", icon: "pen-tool" },
        stackoverflow: { label: "Stack Overflow", icon: "layers" },
        dribbble: { label: "Dribbble", icon: "dribbble" },
        behance: { label: "Behance", icon: "figma" },
        medium: { label: "Medium", icon: "book-open" },
        devto: { label: "DEV.to", icon: "code" },
      };
      return Object.entries(social)
        .filter(([, url]) => has(url))
        .map(([key, url]) => ({
          url,
          label: (map[key] || {}).label || key,
          icon: (map[key] || {}).icon || "link",
        }));
    }

    function icon(name, size) {
      size = size || 18;
      const s = `width="${size}" height="${size}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"`;
      const icons = {
        github: `<svg ${s}><path d="M9 19c-5 1.5-5-2.5-7-3m14 6v-3.87a3.37 3.37 0 0 0-.94-2.61c3.14-.35 6.44-1.54 6.44-7A5.44 5.44 0 0 0 20 4.77 5.07 5.07 0 0 0 19.91 1S18.73.65 16 2.48a13.38 13.38 0 0 0-7 0C6.27.65 5.09 1 5.09 1A5.07 5.07 0 0 0 5 4.77a5.44 5.44 0 0 0-1.5 3.78c0 5.42 3.3 6.61 6.44 7A3.37 3.37 0 0 0 9 18.13V22"/></svg>`,
        linkedin: `<svg ${s}><path d="M16 8a6 6 0 0 1 6 6v7h-4v-7a2 2 0 0 0-4 0v7h-4v-7a6 6 0 0 1 6-6z"/><rect x="2" y="9" width="4" height="12"/><circle cx="4" cy="4" r="2"/></svg>`,
        twitter: `<svg ${s}><path d="M22 4s-.7 2.1-2 3.4c1.6 10-9.4 17.3-18 11.6 2.2.1 4.4-.6 6-2C3 15.5.5 9.6 3 5c2.2 2.6 5.6 4.1 9 4-.9-4.2 4-6.6 7-3.8 1.1 0 3-1.2 3-1.2z"/></svg>`,
        youtube: `<svg ${s}><path d="M22.54 6.42a2.78 2.78 0 0 0-1.94-2C18.88 4 12 4 12 4s-6.88 0-8.6.46a2.78 2.78 0 0 0-1.94 2A29 29 0 0 0 1 11.75a29 29 0 0 0 .46 5.33A2.78 2.78 0 0 0 3.4 19.1c1.72.46 8.6.46 8.6.46s6.88 0 8.6-.46a2.78 2.78 0 0 0 1.94-2 29 29 0 0 0 .46-5.25 29 29 0 0 0-.46-5.33z"/><polygon points="9.75 15.02 15.5 11.75 9.75 8.48 9.75 15.02"/></svg>`,
        "pen-tool": `<svg ${s}><path d="M12 19l7-7 3 3-7 7-3-3z"/><path d="M18 13l-1.5-7.5L2 2l3.5 14.5L13 18l5-5z"/><path d="M2 2l7.586 7.586"/><circle cx="11" cy="11" r="2"/></svg>`,
        layers: `<svg ${s}><polygon points="12 2 2 7 12 12 22 7 12 2"/><polyline points="2 17 12 22 22 17"/><polyline points="2 12 12 17 22 12"/></svg>`,
        dribbble: `<svg ${s}><circle cx="12" cy="12" r="10"/><path d="M8.56 2.75c4.37 6.03 6.02 9.42 8.03 17.72m2.54-15.38c-3.72 4.35-8.94 5.66-16.88 5.85m19.5 1.9c-3.5-.93-6.63-.82-8.94 0-2.58.92-5.01 2.86-7.44 6.32"/></svg>`,
        figma: `<svg ${s}><path d="M5 5.5A3.5 3.5 0 0 1 8.5 2H12v7H8.5A3.5 3.5 0 0 1 5 5.5z"/><path d="M12 2h3.5a3.5 3.5 0 1 1 0 7H12V2z"/><path d="M12 12.5a3.5 3.5 0 1 1 7 0 3.5 3.5 0 1 1-7 0z"/><path d="M5 19.5A3.5 3.5 0 0 1 8.5 16H12v3.5a3.5 3.5 0 1 1-7 0z"/><path d="M5 12.5A3.5 3.5 0 0 1 8.5 9H12v7H8.5A3.5 3.5 0 0 1 5 12.5z"/></svg>`,
        "book-open": `<svg ${s}><path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z"/><path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z"/></svg>`,
        code: `<svg ${s}><polyline points="16 18 22 12 16 6"/><polyline points="8 6 2 12 8 18"/></svg>`,
        link: `<svg ${s}><path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71"/><path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71"/></svg>`,
        mail: `<svg ${s}><path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/><polyline points="22,6 12,13 2,6"/></svg>`,
        globe: `<svg ${s}><circle cx="12" cy="12" r="10"/><line x1="2" y1="12" x2="22" y2="12"/><path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"/></svg>`,
        "map-pin": `<svg ${s}><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/><circle cx="12" cy="10" r="3"/></svg>`,
        "external-link": `<svg ${s}><path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"/><polyline points="15 3 21 3 21 9"/><line x1="10" y1="14" x2="21" y2="3"/></svg>`,
        sun: `<svg ${s}><circle cx="12" cy="12" r="5"/><line x1="12" y1="1" x2="12" y2="3"/><line x1="12" y1="21" x2="12" y2="23"/><line x1="4.22" y1="4.22" x2="5.64" y2="5.64"/><line x1="18.36" y1="18.36" x2="19.78" y2="19.78"/><line x1="1" y1="12" x2="3" y2="12"/><line x1="21" y1="12" x2="23" y2="12"/><line x1="4.22" y1="19.78" x2="5.64" y2="18.36"/><line x1="18.36" y1="5.64" x2="19.78" y2="4.22"/></svg>`,
        moon: `<svg ${s}><path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"/></svg>`,
        terminal: `<svg ${s}><polyline points="4 17 10 11 4 5"/><line x1="12" y1="19" x2="20" y2="19"/></svg>`,
        calendar: `<svg ${s}><rect x="3" y="4" width="18" height="18" rx="2" ry="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>`,
        award: `<svg ${s}><circle cx="12" cy="8" r="7"/><polyline points="8.21 13.89 7 23 12 20 17 23 15.79 13.88"/></svg>`,
        "chevron-up": `<svg ${s}><polyline points="18 15 12 9 6 15"/></svg>`,
        mic: `<svg ${s}><path d="M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3z"/><path d="M19 10v2a7 7 0 0 1-14 0v-2"/><line x1="12" y1="19" x2="12" y2="23"/><line x1="8" y1="23" x2="16" y2="23"/></svg>`,
        "file-text": `<svg ${s}><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/><polyline points="10 9 9 9 8 9"/></svg>`,
        briefcase: `<svg ${s}><rect x="2" y="7" width="20" height="14" rx="2" ry="2"/><path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16"/></svg>`,
        "graduation-cap": `<svg ${s}><path d="M22 10v6M2 10l10-5 10 5-10 5z"/><path d="M6 12v5c0 2 2 3 6 3s6-1 6-3v-5"/></svg>`,
      };
      return icons[name] || icons.link;
    }

    function locationStr() {
      const parts = [location.city, location.state, location.country].filter(Boolean);
      const loc = parts.join(", ");
      if (location.remote && loc) return loc + " (Remote)";
      if (location.remote) return "Remote";
      return loc;
    }

    function levelPercent(level) {
      const map = { expert: 95, advanced: 80, intermediate: 60, beginner: 35 };
      return map[(level || "").toLowerCase()] || 50;
    }

    function levelColor(level) {
      const map = {
        expert: "var(--accent-green)",
        advanced: "var(--accent-blue)",
        intermediate: "var(--accent-yellow)",
        beginner: "var(--accent-magenta)",
      };
      return map[(level || "").toLowerCase()] || "var(--accent-blue)";
    }

    const links = socialLinks();
    const displayName = p.displayName || [p.firstName, p.lastName].filter(Boolean).join(" ") || "Developer";
    const title = p.title || "";
    const headline = p.headline || "";
    const sortedProjects = [...projects].sort((a, b) => (b.featured ? 1 : 0) - (a.featured ? 1 : 0));

    const navItems = [];
    if (has(bio) || has(summary)) navItems.push({ id: "about", label: "about" });
    if (has(skills)) navItems.push({ id: "skills", label: "skills" });
    if (has(projects)) navItems.push({ id: "projects", label: "projects" });
    if (has(experience)) navItems.push({ id: "experience", label: "experience" });
    if (has(education)) navItems.push({ id: "education", label: "education" });
    if (has(talks) || has(publications)) navItems.push({ id: "talks-publications", label: "talks" });
    navItems.push({ id: "contact", label: "contact" });

    return `<!DOCTYPE html>
<html lang="en" data-theme="dark">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>${e(displayName)} — ${e(title || "Portfolio")}</title>
<meta name="description" content="${e(headline || summary || "")}">
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link href="https://fonts.googleapis.com/css2?family=JetBrains+Mono:ital,wght@0,300;0,400;0,500;0,600;0,700;1,400&family=Inter:wght@400;500;600;700&display=swap" rel="stylesheet">
<style>
*,*::before,*::after{box-sizing:border-box;margin:0;padding:0}
html{scroll-behavior:smooth;scroll-padding-top:80px}
body{font-family:'JetBrains Mono','Fira Code','Cascadia Code',monospace;line-height:1.7;transition:background .3s,color .3s}
:root{
  --font-mono:'JetBrains Mono','Fira Code','Cascadia Code','Courier New',monospace;
  --font-sans:'Inter',-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;
  --max-w:1100px;--nav-h:60px;--radius:8px;--transition:0.3s ease;
}
[data-theme="dark"]{
  --bg-primary:#0d1117;--bg-secondary:#161b22;--bg-card:#1c2333;--bg-card-hover:#222d3f;
  --bg-nav:rgba(13,17,23,0.92);--border:#30363d;
  --text-primary:#e6edf3;--text-secondary:#8b949e;--text-muted:#484f58;
  --accent-green:#3fb950;--accent-blue:#58a6ff;--accent-yellow:#d29922;
  --accent-magenta:#bc8cff;--accent-cyan:#39d2c0;--accent-red:#f85149;
  --keyword:#ff7b72;--string:#a5d6ff;--comment:#8b949e;
  --shadow:0 8px 32px rgba(0,0,0,0.4);--glow:0 0 20px rgba(88,166,255,0.15);
}
[data-theme="light"]{
  --bg-primary:#ffffff;--bg-secondary:#f6f8fa;--bg-card:#ffffff;--bg-card-hover:#f3f4f6;
  --bg-nav:rgba(255,255,255,0.92);--border:#d0d7de;
  --text-primary:#1f2328;--text-secondary:#656d76;--text-muted:#8b949e;
  --accent-green:#1a7f37;--accent-blue:#0969da;--accent-yellow:#9a6700;
  --accent-magenta:#8250df;--accent-cyan:#0e7c6b;--accent-red:#cf222e;
  --keyword:#cf222e;--string:#0a3069;--comment:#656d76;
  --shadow:0 8px 32px rgba(0,0,0,0.08);--glow:0 0 20px rgba(9,105,218,0.08);
}
body{background:var(--bg-primary);color:var(--text-primary)}
a{color:var(--accent-blue);text-decoration:none;transition:color var(--transition)}
a:hover{color:var(--accent-cyan)}
::selection{background:var(--accent-blue);color:#fff}

.nav{position:fixed;top:0;left:0;right:0;z-index:1000;height:var(--nav-h);background:var(--bg-nav);backdrop-filter:blur(12px);-webkit-backdrop-filter:blur(12px);border-bottom:1px solid var(--border);display:flex;align-items:center;justify-content:center}
.nav-inner{width:100%;max-width:var(--max-w);padding:0 1.5rem;display:flex;align-items:center;justify-content:space-between}
.nav-logo{font-weight:700;font-size:.95rem;color:var(--accent-green);white-space:nowrap}
.nav-logo .prompt{color:var(--accent-yellow)}
.nav-links{display:flex;gap:.2rem;align-items:center;flex-wrap:wrap}
.nav-links a{color:var(--text-secondary);font-size:.8rem;padding:.35rem .65rem;border-radius:var(--radius);transition:all var(--transition)}
.nav-links a:hover,.nav-links a.active{color:var(--accent-green);background:var(--bg-secondary)}
.theme-toggle{background:none;border:1px solid var(--border);color:var(--text-secondary);cursor:pointer;padding:.4rem;border-radius:var(--radius);display:flex;align-items:center;justify-content:center;transition:all var(--transition);margin-left:.5rem}
.theme-toggle:hover{color:var(--accent-yellow);border-color:var(--accent-yellow)}
@media(max-width:768px){.nav-links a{font-size:.7rem;padding:.25rem .4rem}.nav-logo{font-size:.8rem}}

section{padding:5rem 1.5rem 3rem}
section:first-of-type{padding-top:calc(var(--nav-h) + 4rem)}
.section-inner{max-width:var(--max-w);margin:0 auto}
.section-title{font-size:1.3rem;font-weight:700;margin-bottom:2rem;display:flex;align-items:center;gap:.75rem;color:var(--text-primary)}
.section-title .comment{color:var(--comment);font-weight:400;font-size:.9rem}
.section-title::after{content:"";flex:1;height:1px;background:var(--border)}

.fade-in{opacity:0;transform:translateY(24px);transition:opacity .6s ease,transform .6s ease}
.fade-in.visible{opacity:1;transform:translateY(0)}

.hero{min-height:85vh;display:flex;align-items:center;padding-top:calc(var(--nav-h) + 2rem)}
.hero-content{max-width:var(--max-w);margin:0 auto;width:100%}
.hero-greeting{color:var(--accent-green);font-size:.95rem;margin-bottom:.75rem;font-weight:400}
.hero-greeting .keyword{color:var(--keyword)}
.hero-name{font-size:clamp(2rem,6vw,3.5rem);font-weight:700;line-height:1.2;margin-bottom:.5rem;color:var(--text-primary)}
.hero-title{font-size:clamp(1rem,3vw,1.5rem);color:var(--accent-yellow);font-weight:500;margin-bottom:1rem}
.hero-headline{font-size:clamp(.85rem,2vw,1.05rem);color:var(--text-secondary);max-width:600px;margin-bottom:2rem;line-height:1.8;font-weight:400}
.hero-cta{display:flex;gap:1rem;flex-wrap:wrap;margin-bottom:2rem}
.btn{display:inline-flex;align-items:center;gap:.5rem;padding:.65rem 1.4rem;border-radius:var(--radius);font-family:var(--font-mono);font-size:.85rem;font-weight:500;border:1px solid var(--border);cursor:pointer;transition:all var(--transition);text-decoration:none}
.btn-primary{background:var(--accent-green);color:#0d1117;border-color:var(--accent-green)}
.btn-primary:hover{background:#2ea043;color:#0d1117;transform:translateY(-2px);box-shadow:var(--glow)}
.btn-secondary{background:transparent;color:var(--text-primary)}
.btn-secondary:hover{border-color:var(--accent-blue);color:var(--accent-blue);transform:translateY(-2px)}
.hero-social{display:flex;gap:.75rem;flex-wrap:wrap}
.hero-social a{color:var(--text-muted);display:flex;align-items:center;gap:.4rem;font-size:.8rem;padding:.3rem .5rem;border-radius:var(--radius);transition:all var(--transition)}
.hero-social a:hover{color:var(--accent-blue);background:var(--bg-secondary)}

.about-grid{display:grid;grid-template-columns:1fr;gap:2rem;align-items:start}
.about-grid.has-photo{grid-template-columns:1fr 220px}
.about-text{font-size:.92rem;color:var(--text-secondary);line-height:1.9}
.about-text p{margin-bottom:1rem}
.about-location{display:inline-flex;align-items:center;gap:.4rem;color:var(--accent-cyan);font-size:.85rem;margin-top:.5rem}
.about-photo{width:200px;height:200px;border-radius:var(--radius);border:2px solid var(--border);object-fit:cover;filter:grayscale(20%);transition:filter var(--transition)}
.about-photo:hover{filter:grayscale(0)}
@media(max-width:768px){.about-grid.has-photo{grid-template-columns:1fr}.about-photo{width:150px;height:150px;margin:0 auto}}

.skills-grid{display:grid;grid-template-columns:repeat(auto-fit,minmax(280px,1fr));gap:1.5rem}
.skill-group{background:var(--bg-card);border:1px solid var(--border);border-radius:var(--radius);padding:1.5rem;transition:all var(--transition)}
.skill-group:hover{border-color:var(--accent-blue);box-shadow:var(--glow)}
.skill-group h3{font-size:.9rem;color:var(--accent-magenta);margin-bottom:1.2rem;font-weight:600}
.skill-group h3::before{content:"// ";color:var(--comment)}
.skill-item{margin-bottom:1rem}.skill-item:last-child{margin-bottom:0}
.skill-label{display:flex;justify-content:space-between;align-items:center;font-size:.8rem;margin-bottom:.35rem}
.skill-label span:first-child{color:var(--text-primary)}
.skill-level-text{font-size:.7rem;color:var(--text-muted);text-transform:uppercase;letter-spacing:.5px}
.skill-bar{height:6px;background:var(--bg-primary);border-radius:3px;overflow:hidden}
.skill-bar-fill{height:100%;border-radius:3px;transition:width 1s ease .3s;width:0}

.projects-grid{display:grid;grid-template-columns:repeat(auto-fit,minmax(320px,1fr));gap:1.5rem}
.project-card{background:var(--bg-card);border:1px solid var(--border);border-radius:var(--radius);padding:1.5rem;transition:all var(--transition);position:relative;overflow:hidden}
.project-card:hover{border-color:var(--accent-green);transform:translateY(-4px);box-shadow:var(--shadow)}
.project-card.featured::before{content:"*";position:absolute;top:.75rem;right:.75rem;color:var(--accent-yellow);font-size:1.2rem}
.project-name{font-size:1.05rem;font-weight:700;color:var(--accent-green);margin-bottom:.25rem}
.project-tagline{font-size:.8rem;color:var(--accent-yellow);margin-bottom:.75rem;font-style:italic}
.project-desc{font-size:.82rem;color:var(--text-secondary);line-height:1.7;margin-bottom:1rem}
.project-highlights{list-style:none;margin-bottom:1rem}
.project-highlights li{font-size:.78rem;color:var(--text-secondary);padding-left:1.2rem;position:relative;margin-bottom:.3rem}
.project-highlights li::before{content:">";position:absolute;left:0;color:var(--accent-green);font-weight:700}
.project-tags{display:flex;flex-wrap:wrap;gap:.4rem;margin-bottom:1rem}
.tag{font-size:.7rem;padding:.2rem .55rem;border-radius:4px;background:var(--bg-primary);color:var(--accent-cyan);border:1px solid var(--border)}
.project-links{display:flex;gap:.75rem}
.project-links a{font-size:.78rem;display:inline-flex;align-items:center;gap:.35rem;color:var(--text-muted);transition:color var(--transition)}
.project-links a:hover{color:var(--accent-blue)}

.timeline{position:relative;padding-left:2rem}
.timeline::before{content:"";position:absolute;left:6px;top:0;bottom:0;width:2px;background:var(--border)}
.timeline-item{position:relative;margin-bottom:2.5rem;padding-left:1.5rem}
.timeline-item::before{content:"";position:absolute;left:-2rem;top:.6rem;width:14px;height:14px;border-radius:50%;background:var(--bg-primary);border:3px solid var(--accent-green);z-index:1}
.timeline-item.current::before{background:var(--accent-green);box-shadow:0 0 8px var(--accent-green)}
.timeline-header{margin-bottom:.75rem}
.timeline-role{font-size:1rem;font-weight:700;color:var(--text-primary)}
.timeline-company{font-size:.9rem;color:var(--accent-blue)}
.timeline-company a{color:var(--accent-blue)}.timeline-company a:hover{color:var(--accent-cyan)}
.timeline-meta{font-size:.78rem;color:var(--text-muted);margin-top:.25rem;display:flex;flex-wrap:wrap;gap:1rem;align-items:center}
.timeline-desc{font-size:.85rem;color:var(--text-secondary);margin-bottom:.75rem;line-height:1.7}
.timeline-highlights{list-style:none;margin-bottom:.75rem}
.timeline-highlights li{font-size:.82rem;color:var(--text-secondary);line-height:1.7;padding-left:1.2rem;position:relative;margin-bottom:.35rem}
.timeline-highlights li::before{content:"-";position:absolute;left:0;color:var(--accent-yellow);font-weight:700}
.timeline-tech{display:flex;flex-wrap:wrap;gap:.4rem}

.education-list{display:grid;gap:1.5rem}
.education-item{background:var(--bg-card);border:1px solid var(--border);border-radius:var(--radius);padding:1.5rem;transition:all var(--transition)}
.education-item:hover{border-color:var(--accent-magenta);box-shadow:var(--glow)}
.education-degree{font-size:1rem;font-weight:700;color:var(--text-primary)}
.education-field{font-size:.9rem;color:var(--accent-magenta)}
.education-institution{font-size:.85rem;color:var(--accent-blue);margin-top:.25rem}
.education-meta{font-size:.78rem;color:var(--text-muted);margin-top:.25rem}
.education-honors{list-style:none;margin-top:.75rem}
.education-honors li{font-size:.8rem;color:var(--accent-yellow);padding-left:1.2rem;position:relative;margin-bottom:.25rem}
.education-honors li::before{content:"*";position:absolute;left:0;color:var(--accent-green)}

.talks-grid{display:grid;grid-template-columns:repeat(auto-fit,minmax(300px,1fr));gap:1.5rem}
.talk-card,.pub-card{background:var(--bg-card);border:1px solid var(--border);border-radius:var(--radius);padding:1.25rem;transition:all var(--transition)}
.talk-card:hover,.pub-card:hover{border-color:var(--accent-cyan);box-shadow:var(--glow)}
.talk-card h4,.pub-card h4{font-size:.9rem;font-weight:600;color:var(--text-primary);margin-bottom:.4rem}
.talk-event{font-size:.8rem;color:var(--accent-cyan)}
.talk-meta{font-size:.75rem;color:var(--text-muted);margin-top:.25rem;margin-bottom:.5rem}
.pub-publisher{font-size:.8rem;color:var(--accent-magenta)}
.pub-date{font-size:.75rem;color:var(--text-muted);margin-top:.2rem;margin-bottom:.5rem}
.card-links{display:flex;gap:.75rem;flex-wrap:wrap}
.card-links a{font-size:.75rem;display:inline-flex;align-items:center;gap:.3rem;color:var(--text-muted);transition:color var(--transition)}
.card-links a:hover{color:var(--accent-blue)}

.contact-grid{display:grid;grid-template-columns:repeat(auto-fit,minmax(250px,1fr));gap:1.5rem}
.contact-item{display:flex;align-items:center;gap:.75rem;padding:1rem;background:var(--bg-card);border:1px solid var(--border);border-radius:var(--radius);transition:all var(--transition)}
.contact-item:hover{border-color:var(--accent-blue);box-shadow:var(--glow)}
.contact-item svg{flex-shrink:0;color:var(--accent-green)}
.contact-item .contact-label{font-size:.75rem;color:var(--text-muted)}
.contact-item .contact-value{font-size:.85rem;color:var(--text-primary)}
.contact-item a{color:var(--accent-blue)}

footer{text-align:center;padding:3rem 1.5rem;border-top:1px solid var(--border);font-size:.78rem;color:var(--text-muted)}
footer a{color:var(--accent-blue)}

.back-to-top{position:fixed;bottom:2rem;right:2rem;width:40px;height:40px;border-radius:var(--radius);background:var(--bg-card);border:1px solid var(--border);color:var(--text-secondary);cursor:pointer;display:flex;align-items:center;justify-content:center;opacity:0;pointer-events:none;transition:all var(--transition);z-index:999}
.back-to-top.visible{opacity:1;pointer-events:auto}
.back-to-top:hover{border-color:var(--accent-green);color:var(--accent-green)}

@media(max-width:600px){section{padding:3rem 1rem 2rem}.projects-grid,.talks-grid{grid-template-columns:1fr}.timeline{padding-left:1.5rem}.timeline-item{padding-left:1rem}}
</style>
</head>
<body>
<nav class="nav" role="navigation" aria-label="Main navigation">
  <div class="nav-inner">
    <div class="nav-logo"><span class="prompt">&gt;</span> ${e(displayName.toLowerCase().replace(/\s+/g, "_"))}${has(title) ? ` <span style="color:var(--comment)">--role</span> <span style="color:var(--string)">"${e(title)}"</span>` : ""}</div>
    <div class="nav-links">
      ${navItems.map((n) => `<a href="#${n.id}">${n.label}</a>`).join("\n      ")}
      <button class="theme-toggle" id="themeToggle" aria-label="Toggle dark/light mode" title="Toggle theme"><span class="toggle-icon">${icon("moon", 16)}</span></button>
    </div>
  </div>
</nav>

<section class="hero" id="hero">
  <div class="hero-content fade-in">
    <p class="hero-greeting"><span class="keyword">const</span> developer = {</p>
    <h1 class="hero-name">${e(displayName)}</h1>
    ${has(title) ? `<p class="hero-title">${e(title)}</p>` : ""}
    ${has(headline) ? `<p class="hero-headline">${e(headline)}</p>` : ""}
    <div class="hero-cta">
      ${has(contact.email) ? `<a href="mailto:${e(contact.email)}" class="btn btn-primary">${icon("mail", 16)} Get in touch</a>` : ""}
      ${has(projects) ? `<a href="#projects" class="btn btn-secondary">${icon("code", 16)} View projects</a>` : ""}
    </div>
    ${links.length > 0 ? `<div class="hero-social">${links.map((l) => `<a href="${e(l.url)}" target="_blank" rel="noopener noreferrer">${icon(l.icon, 16)} ${e(l.label)}</a>`).join("")}</div>` : ""}
    <p style="color:var(--accent-green);margin-top:1.5rem;font-size:.95rem">};</p>
  </div>
</section>

${has(bio) || has(summary) ? `<section id="about"><div class="section-inner fade-in">
    <h2 class="section-title">${icon("terminal", 20)} about <span class="comment">// who I am</span></h2>
    <div class="about-grid${has(p.photo) ? " has-photo" : ""}">
      <div class="about-text">
        ${has(bio) ? `<p>${e(bio)}</p>` : ""}
        ${has(summary) && summary !== bio ? `<p>${e(summary)}</p>` : ""}
        ${has(locationStr()) ? `<div class="about-location">${icon("map-pin", 14)} ${e(locationStr())}</div>` : ""}
      </div>
      ${has(p.photo) ? `<img class="about-photo" src="${e(p.photo)}" alt="Photo of ${e(displayName)}" loading="lazy">` : ""}
    </div>
  </div></section>` : ""}

${has(skills) ? `<section id="skills"><div class="section-inner fade-in">
    <h2 class="section-title">${icon("code", 20)} skills <span class="comment">// tech stack</span></h2>
    <div class="skills-grid">
      ${skills.filter((g) => has(g.items)).map((group) => `<div class="skill-group">
        <h3>${e(group.category)}</h3>
        ${group.items.map((item) => `<div class="skill-item">
          <div class="skill-label"><span>${e(item.name)}</span><span class="skill-level-text">${e(item.level || "")}</span></div>
          <div class="skill-bar"><div class="skill-bar-fill" style="background:${levelColor(item.level)}" data-width="${levelPercent(item.level)}%"></div></div>
        </div>`).join("")}
      </div>`).join("")}
    </div>
  </div></section>` : ""}

${has(projects) ? `<section id="projects"><div class="section-inner fade-in">
    <h2 class="section-title">${icon("code", 20)} projects <span class="comment">// things I've built</span></h2>
    <div class="projects-grid">
      ${sortedProjects.map((proj) => `<div class="project-card${proj.featured ? " featured" : ""}">
        <div class="project-name">${e(proj.name)}</div>
        ${has(proj.tagline) ? `<div class="project-tagline">${e(proj.tagline)}</div>` : ""}
        ${has(proj.description) ? `<p class="project-desc">${e(proj.description)}</p>` : ""}
        ${has(proj.highlights) ? `<ul class="project-highlights">${proj.highlights.map((h) => `<li>${e(h)}</li>`).join("")}</ul>` : ""}
        ${has(proj.techStack) ? `<div class="project-tags">${proj.techStack.map((t) => `<span class="tag">${e(t)}</span>`).join("")}</div>` : ""}
        <div class="project-links">
          ${has(proj.liveUrl) ? `<a href="${e(proj.liveUrl)}" target="_blank" rel="noopener noreferrer">${icon("external-link", 14)} Live</a>` : ""}
          ${has(proj.repoUrl) ? `<a href="${e(proj.repoUrl)}" target="_blank" rel="noopener noreferrer">${icon("github", 14)} Code</a>` : ""}
        </div>
      </div>`).join("")}
    </div>
  </div></section>` : ""}

${has(experience) ? `<section id="experience"><div class="section-inner fade-in">
    <h2 class="section-title">${icon("briefcase", 20)} experience <span class="comment">// where I've worked</span></h2>
    <div class="timeline">
      ${experience.map((exp) => `<div class="timeline-item${exp.current ? " current" : ""}">
        <div class="timeline-header">
          <div class="timeline-role">${e(exp.role)}</div>
          <div class="timeline-company">${has(exp.url) ? `<a href="${e(exp.url)}" target="_blank" rel="noopener noreferrer">${e(exp.company)}</a>` : e(exp.company)}</div>
          <div class="timeline-meta">
            <span>${icon("calendar", 12)} ${fmtDate(exp.startDate)} — ${exp.current ? "Present" : fmtDate(exp.endDate)}</span>
            ${has(exp.location) ? `<span>${icon("map-pin", 12)} ${e(exp.location)}</span>` : ""}
          </div>
        </div>
        ${has(exp.description) ? `<p class="timeline-desc">${e(exp.description)}</p>` : ""}
        ${has(exp.highlights) ? `<ul class="timeline-highlights">${exp.highlights.map((h) => `<li>${e(h)}</li>`).join("")}</ul>` : ""}
        ${has(exp.techStack) ? `<div class="timeline-tech">${exp.techStack.map((t) => `<span class="tag">${e(t)}</span>`).join("")}</div>` : ""}
      </div>`).join("")}
    </div>
  </div></section>` : ""}

${has(education) ? `<section id="education"><div class="section-inner fade-in">
    <h2 class="section-title">${icon("graduation-cap", 20)} education <span class="comment">// academic background</span></h2>
    <div class="education-list">
      ${education.map((edu) => `<div class="education-item">
        <div class="education-degree">${e(edu.degree)}${has(edu.field) ? ` in ${e(edu.field)}` : ""}</div>
        <div class="education-institution">${e(edu.institution)}</div>
        <div class="education-meta">${has(edu.startDate) || has(edu.endDate) ? `${e(edu.startDate || "")} — ${e(edu.endDate || "Present")}` : ""}${has(edu.gpa) ? ` | GPA: ${e(edu.gpa)}` : ""}</div>
        ${has(edu.honors) ? `<ul class="education-honors">${edu.honors.map((h) => `<li>${e(h)}</li>`).join("")}</ul>` : ""}
      </div>`).join("")}
    </div>
  </div></section>` : ""}

${has(talks) || has(publications) ? `<section id="talks-publications"><div class="section-inner fade-in">
    <h2 class="section-title">${icon("mic", 20)} talks & publications <span class="comment">// sharing knowledge</span></h2>
    <div class="talks-grid">
      ${talks.map((talk) => `<div class="talk-card">
        <h4>${e(talk.title)}</h4>
        <div class="talk-event">${e(talk.event)}</div>
        <div class="talk-meta">${fmtDate(talk.date)}${has(talk.location) ? ` | ${e(talk.location)}` : ""}</div>
        <div class="card-links">
          ${has(talk.slidesUrl) ? `<a href="${e(talk.slidesUrl)}" target="_blank" rel="noopener noreferrer">${icon("external-link", 13)} Slides</a>` : ""}
          ${has(talk.videoUrl) ? `<a href="${e(talk.videoUrl)}" target="_blank" rel="noopener noreferrer">${icon("youtube", 13)} Video</a>` : ""}
        </div>
      </div>`).join("")}
      ${publications.map((pub) => `<div class="pub-card">
        <h4>${has(pub.url) ? `<a href="${e(pub.url)}" target="_blank" rel="noopener noreferrer">${e(pub.title)}</a>` : e(pub.title)}</h4>
        <div class="pub-publisher">${icon("file-text", 13)} ${e(pub.publisher)}</div>
        <div class="pub-date">${fmtDate(pub.date)}</div>
        ${has(pub.url) ? `<div class="card-links"><a href="${e(pub.url)}" target="_blank" rel="noopener noreferrer">${icon("external-link", 13)} Read article</a></div>` : ""}
      </div>`).join("")}
    </div>
  </div></section>` : ""}

<section id="contact"><div class="section-inner fade-in">
    <h2 class="section-title">${icon("mail", 20)} contact <span class="comment">// let's connect</span></h2>
    <div class="contact-grid">
      ${has(contact.email) ? `<div class="contact-item">${icon("mail", 20)}<div><div class="contact-label">Email</div><div class="contact-value"><a href="mailto:${e(contact.email)}">${e(contact.email)}</a></div></div></div>` : ""}
      ${has(contact.website) ? `<div class="contact-item">${icon("globe", 20)}<div><div class="contact-label">Website</div><div class="contact-value"><a href="${e(contact.website)}" target="_blank" rel="noopener noreferrer">${e(contact.website)}</a></div></div></div>` : ""}
      ${has(contact.phone) ? `<div class="contact-item">${icon("terminal", 20)}<div><div class="contact-label">Phone</div><div class="contact-value">${e(contact.phone)}</div></div></div>` : ""}
      ${links.map((l) => `<div class="contact-item">${icon(l.icon, 20)}<div><div class="contact-label">${e(l.label)}</div><div class="contact-value"><a href="${e(l.url)}" target="_blank" rel="noopener noreferrer">${e(l.url.replace(/^https?:\/\//, ""))}</a></div></div></div>`).join("")}
    </div>
  </div></section>

<footer>
  <p>Built with <a href="https://github.com/praveenscience/One-File-Tools" target="_blank" rel="noopener noreferrer">One File Tools</a> — one file at a time.</p>
  <p style="margin-top:.5rem">&copy; ${new Date().getFullYear()} ${e(displayName)}</p>
</footer>

<button class="back-to-top" id="backToTop" aria-label="Back to top">${icon("chevron-up", 20)}</button>

<script>
(function(){
  "use strict";
  var root=document.documentElement,toggle=document.getElementById("themeToggle"),iconSpan=toggle.querySelector(".toggle-icon");
  var moonSvg='${icon("moon", 16).replace(/'/g, "\\'")}',sunSvg='${icon("sun", 16).replace(/'/g, "\\'")}';
  function getPreferred(){var s=localStorage.getItem("portfolio-theme");if(s)return s;return window.matchMedia("(prefers-color-scheme:light)").matches?"light":"dark"}
  function applyTheme(t){root.setAttribute("data-theme",t);iconSpan.innerHTML=t==="dark"?moonSvg:sunSvg;localStorage.setItem("portfolio-theme",t)}
  applyTheme(getPreferred());
  toggle.addEventListener("click",function(){applyTheme(root.getAttribute("data-theme")==="dark"?"light":"dark")});

  var fadeEls=document.querySelectorAll(".fade-in");
  if("IntersectionObserver"in window){var obs=new IntersectionObserver(function(entries){entries.forEach(function(en){if(en.isIntersecting){en.target.classList.add("visible");obs.unobserve(en.target)}})},{threshold:0.1,rootMargin:"0px 0px -40px 0px"});fadeEls.forEach(function(el){obs.observe(el)})}
  else{fadeEls.forEach(function(el){el.classList.add("visible")})}

  var bars=document.querySelectorAll(".skill-bar-fill");
  if("IntersectionObserver"in window){var bObs=new IntersectionObserver(function(entries){entries.forEach(function(en){if(en.isIntersecting){en.target.style.width=en.target.getAttribute("data-width");bObs.unobserve(en.target)}})},{threshold:0.3});bars.forEach(function(b){bObs.observe(b)})}
  else{bars.forEach(function(b){b.style.width=b.getAttribute("data-width")})}

  var sections=document.querySelectorAll("section[id]"),navLinks=document.querySelectorAll(".nav-links a[href^=\\"#\\"]");
  function updateNav(){var y=window.scrollY+100;sections.forEach(function(sec){var top=sec.offsetTop,h=sec.offsetHeight,id=sec.getAttribute("id");if(y>=top&&y<top+h){navLinks.forEach(function(a){a.classList.remove("active");if(a.getAttribute("href")==="#"+id)a.classList.add("active")})}})}
  window.addEventListener("scroll",updateNav,{passive:true});updateNav();

  var btt=document.getElementById("backToTop");
  window.addEventListener("scroll",function(){btt.classList.toggle("visible",window.scrollY>500)},{passive:true});
  btt.addEventListener("click",function(){window.scrollTo({top:0,behavior:"smooth"})});
})();
</script>
</body>
</html>`;
  }

  // ── Showcase page: Resume ──

  function buildResumeShowcase() {
    return `<!DOCTYPE html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>Resume Themes — One File Tools</title>
    <style>
      *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
      body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif; line-height: 1.6; background: #0a0a0a; color: #e5e5e5; }
      .top-bar { position: fixed; top: 0; left: 0; right: 0; z-index: 1000; background: #18181b; border-bottom: 1px solid #27272a; padding: 0.6rem 1.5rem; display: flex; align-items: center; gap: 0.75rem; }
      .pillar-nav { display: flex; gap: 0.25rem; }
      .pillar-link { font-size: 0.8rem; font-weight: 600; padding: 0.35rem 0.75rem; border-radius: 6px; color: #d4d4d8; text-decoration: none; transition: all 0.2s; }
      .pillar-link:hover { background: #27272a; color: #fff; }
      .pillar-link.active { background: #3b82f6; color: #fff; }
      .container { max-width: 900px; margin: 0 auto; padding: 5rem 1.5rem 3rem; }
      h1 { font-size: 2rem; font-weight: 700; margin-bottom: 0.5rem; }
      .subtitle { color: #a1a1aa; font-size: 1.05rem; margin-bottom: 2rem; }
      .theme-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(280px, 1fr)); gap: 1.25rem; }
      .theme-card { background: #18181b; border: 1px solid #27272a; border-radius: 12px; overflow: hidden; transition: all 0.2s; }
      .theme-card:hover { border-color: #3b82f6; transform: translateY(-3px); box-shadow: 0 10px 40px rgba(0,0,0,0.4); }
      .theme-thumb { width: 100%; height: 200px; background: #27272a; display: flex; align-items: center; justify-content: center; color: #52525b; font-size: 3rem; }
      .theme-info { padding: 1.25rem; }
      .theme-info h3 { font-size: 1.1rem; font-weight: 600; margin-bottom: 0.3rem; }
      .theme-info p { font-size: 0.85rem; color: #a1a1aa; margin-bottom: 1rem; }
      .theme-links { display: flex; gap: 0.5rem; }
      .theme-links a { font-size: 0.8rem; font-weight: 600; padding: 0.4rem 0.9rem; border-radius: 6px; text-decoration: none; transition: all 0.2s; }
      .btn-primary { background: #3b82f6; color: #fff; }
      .btn-primary:hover { background: #2563eb; }
      .btn-outline { background: transparent; color: #3b82f6; border: 1px solid #3b82f6; }
      .btn-outline:hover { background: #3b82f6; color: #fff; }
      footer { text-align: center; padding: 2rem; color: #52525b; font-size: 0.85rem; }
      footer a { color: #3b82f6; text-decoration: none; }
      @media (prefers-color-scheme: light) {
        body { background: #fafafa; color: #1a1a1a; }
        .top-bar { background: #fff; border-color: #e5e7eb; }
        .pillar-link { color: #6b7280; }
        .pillar-link:hover { background: #f5f5f5; color: #1a1a1a; }
        .theme-card { background: #fff; border-color: #e5e7eb; }
        .theme-thumb { background: #f5f5f5; color: #d4d4d8; }
        .theme-info p { color: #6b7280; }
        .subtitle { color: #6b7280; }
        footer { color: #a1a1aa; }
      }
    </style>
  </head>
  <body>
    <nav class="top-bar">
      <div class="pillar-nav">
        <a href="../index.html" class="pillar-link">Tools</a>
        <a href="../portfolio/index.html" class="pillar-link">Portfolio</a>
        <a href="index.html" class="pillar-link active">Resume</a>
      </div>
    </nav>
    <div class="container">
      <h1>Resume Themes</h1>
      <p class="subtitle">Print-ready, ATS-compliant resumes. Pure HTML+CSS, zero JavaScript. Edit profile.json, run the build, print to PDF.</p>
      <div class="theme-grid">
        <div class="theme-card">
          <div class="theme-thumb">&#128196;</div>
          <div class="theme-info">
            <h3>Classic</h3>
            <p>Traditional single-column layout. Conservative, corporate-safe. Clean typography with clear section hierarchy.</p>
            <div class="theme-links">
              <a href="themes/classic.html" class="btn-primary">Preview</a>
              <a href="themes/classic.html" class="btn-outline" onclick="window.open(this.href);setTimeout(function(){window.open(this.href).print()},500);return false;">Print</a>
            </div>
          </div>
        </div>
      </div>
    </div>
    <footer>
      <p>Part of <a href="https://github.com/praveenscience/One-File-Tools">One File Tools</a>. Want to add a theme? Check the <a href="https://github.com/praveenscience/One-File-Tools/blob/main/Contributing.md">Contributing Guide</a>.</p>
    </footer>
  </body>
</html>`;
  }

  // ── Showcase page: Portfolio ──

  function buildPortfolioShowcase() {
    return `<!DOCTYPE html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>Portfolio Themes — One File Tools</title>
    <style>
      *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
      body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif; line-height: 1.6; background: #0a0a0a; color: #e5e5e5; }
      .top-bar { position: fixed; top: 0; left: 0; right: 0; z-index: 1000; background: #18181b; border-bottom: 1px solid #27272a; padding: 0.6rem 1.5rem; display: flex; align-items: center; gap: 0.75rem; }
      .pillar-nav { display: flex; gap: 0.25rem; }
      .pillar-link { font-size: 0.8rem; font-weight: 600; padding: 0.35rem 0.75rem; border-radius: 6px; color: #d4d4d8; text-decoration: none; transition: all 0.2s; }
      .pillar-link:hover { background: #27272a; color: #fff; }
      .pillar-link.active { background: #3b82f6; color: #fff; }
      .container { max-width: 900px; margin: 0 auto; padding: 5rem 1.5rem 3rem; }
      h1 { font-size: 2rem; font-weight: 700; margin-bottom: 0.5rem; }
      .subtitle { color: #a1a1aa; font-size: 1.05rem; margin-bottom: 2rem; }
      .theme-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(280px, 1fr)); gap: 1.25rem; }
      .theme-card { background: #18181b; border: 1px solid #27272a; border-radius: 12px; overflow: hidden; transition: all 0.2s; }
      .theme-card:hover { border-color: #3b82f6; transform: translateY(-3px); box-shadow: 0 10px 40px rgba(0,0,0,0.4); }
      .theme-thumb { width: 100%; height: 200px; background: #27272a; display: flex; align-items: center; justify-content: center; color: #52525b; font-size: 3rem; }
      .theme-info { padding: 1.25rem; }
      .theme-info h3 { font-size: 1.1rem; font-weight: 600; margin-bottom: 0.3rem; }
      .theme-info p { font-size: 0.85rem; color: #a1a1aa; margin-bottom: 1rem; }
      .theme-links { display: flex; gap: 0.5rem; }
      .theme-links a { font-size: 0.8rem; font-weight: 600; padding: 0.4rem 0.9rem; border-radius: 6px; text-decoration: none; transition: all 0.2s; }
      .btn-primary { background: #3b82f6; color: #fff; }
      .btn-primary:hover { background: #2563eb; }
      .btn-outline { background: transparent; color: #3b82f6; border: 1px solid #3b82f6; }
      .btn-outline:hover { background: #3b82f6; color: #fff; }
      footer { text-align: center; padding: 2rem; color: #52525b; font-size: 0.85rem; }
      footer a { color: #3b82f6; text-decoration: none; }
      @media (prefers-color-scheme: light) {
        body { background: #fafafa; color: #1a1a1a; }
        .top-bar { background: #fff; border-color: #e5e7eb; }
        .pillar-link { color: #6b7280; }
        .pillar-link:hover { background: #f5f5f5; color: #1a1a1a; }
        .theme-card { background: #fff; border-color: #e5e7eb; }
        .theme-thumb { background: #f5f5f5; color: #d4d4d8; }
        .theme-info p { color: #6b7280; }
        .subtitle { color: #6b7280; }
        footer { color: #a1a1aa; }
      }
    </style>
  </head>
  <body>
    <nav class="top-bar">
      <div class="pillar-nav">
        <a href="../index.html" class="pillar-link">Tools</a>
        <a href="index.html" class="pillar-link active">Portfolio</a>
        <a href="../resume/index.html" class="pillar-link">Resume</a>
      </div>
    </nav>
    <div class="container">
      <h1>Portfolio Themes</h1>
      <p class="subtitle">Developer portfolios generated from profile.json. Responsive, dark/light mode, self-contained HTML files.</p>
      <div class="theme-grid">
        <div class="theme-card">
          <div class="theme-thumb">&#128187;</div>
          <div class="theme-info">
            <h3>Developer</h3>
            <p>Terminal/IDE aesthetic with monospace fonts, dark by default. Code-focused with syntax-highlight color accents.</p>
            <div class="theme-links">
              <a href="themes/developer.html" class="btn-primary">Preview</a>
            </div>
          </div>
        </div>
      </div>
    </div>
    <footer>
      <p>Part of <a href="https://github.com/praveenscience/One-File-Tools">One File Tools</a>. Want to add a theme? Check the <a href="https://github.com/praveenscience/One-File-Tools/blob/main/Contributing.md">Contributing Guide</a>.</p>
    </footer>
  </body>
</html>`;
  }

  // ── Write resume & portfolio files ──

  const resumeDir = path.join(__dirname, "resume", "themes");
  const portfolioDir = path.join(__dirname, "portfolio", "themes");
  fs.mkdirSync(resumeDir, { recursive: true });
  fs.mkdirSync(portfolioDir, { recursive: true });

  // Resume themes
  fs.writeFileSync(path.join(resumeDir, "classic.html"), buildResumeClassic(profile), "utf-8");
  console.log("\nBuilt resume/themes/classic.html");

  // Portfolio themes
  fs.writeFileSync(path.join(portfolioDir, "developer.html"), buildPortfolioDeveloper(profile), "utf-8");
  console.log("Built portfolio/themes/developer.html");

  // Showcase pages
  fs.writeFileSync(path.join(__dirname, "resume", "index.html"), buildResumeShowcase(), "utf-8");
  fs.writeFileSync(path.join(__dirname, "portfolio", "index.html"), buildPortfolioShowcase(), "utf-8");
  console.log("Built resume/index.html");
  console.log("Built portfolio/index.html");

} else {
  console.log("\nSkipping resume/portfolio generation (no profile.json found).");
}
