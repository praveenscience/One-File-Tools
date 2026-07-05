#!/usr/bin/env node

/**
 * Build script for One File Tools.
 *
 * Reads tools.json and generates index.html with 5 switchable design layouts.
 * Zero npm dependencies - runs with plain Node.js.
 *
 * Usage:
 *   node scripts/build.js
 *
 * Cloudflare Pages build command:
 *   node scripts/build.js
 */

const fs = require("fs");
const path = require("path");

const rootDir = path.join(__dirname, "..");

// ──────────────────────────────────────────────
// Load data
// ──────────────────────────────────────────────

const data = JSON.parse(fs.readFileSync(path.join(rootDir, "data", "tools.json"), "utf-8"));
const { site, categories, tools } = data;

// Quests registry is optional — build should not fail if it doesn't exist yet.
const questsPath = path.join(rootDir, "data", "quests.json");
const questsDataRaw = fs.existsSync(questsPath) ? JSON.parse(fs.readFileSync(questsPath, "utf-8")) : { categories: [], quests: [] };
const questCategories = questsDataRaw.categories || [];
const quests = questsDataRaw.quests || [];

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
  return fs.existsSync(path.join(rootDir, "tools", toolId + ".png"));
}

function questThumbnailExists(questId) {
  return fs.existsSync(path.join(rootDir, "quests", questId + ".png"));
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
// Build quest data
// ──────────────────────────────────────────────

const questCategoryMap = {};
questCategories.forEach((c) => {
  questCategoryMap[c.id] = c;
});

const questsDataBuilt = quests.map((q) => ({
  id: q.id,
  name: q.name,
  shortDescription: q.shortDescription,
  longDescriptionHtml: markdownToHtml(q.longDescription),
  category: q.category,
  categoryName: questCategoryMap[q.category]?.name || q.category,
  categoryIcon: questCategoryMap[q.category]?.icon || "",
  tags: q.tags || [],
  techStack: q.techStack || [],
  difficulty: q.difficulty || "Easy",
  status: q.status || "idea",
  hasThumbnail: questThumbnailExists(q.id),
  file: `quests/${q.id}.html`,
  thumbnail: `quests/${q.id}.png`,
  github: `${site.github}/blob/main/quests/${q.id}.html`,
  live: `${site.url}/quests/${q.id}`
}));

const totalQuestCount = questsDataBuilt.length;

const questCountByCategory = {};
questCategories.forEach((c) => { questCountByCategory[c.id] = 0; });
questsDataBuilt.forEach((q) => { if (questCountByCategory[q.category] !== undefined) questCountByCategory[q.category]++; });

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
      count: resumeThemes.length + " theme" + (resumeThemes.length === 1 ? "" : "s"),
      desc: "ATS-friendly resume themes from a single JSON file. Zero JS, A4 print-ready.",
      icon: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><path d="M14 2v6h6M9 13h6M9 17h4"/></svg>'
    },
    {
      id: "portfolio",
      title: "One File Portfolio",
      count: portfolioThemes.length + " theme" + (portfolioThemes.length === 1 ? "" : "s"),
      desc: "Developer portfolio themes from a single JSON file. Dark/light, responsive.",
      icon: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="4" width="18" height="16" rx="2"/><path d="M3 9h18M7 6.5h.01M10 6.5h.01"/></svg>'
    },
    {
      id: "quests",
      title: "One File Quests",
      count: totalQuestCount + " quest" + (totalQuestCount === 1 ? "" : "s"),
      desc: "Interactive, gamified lessons to learn Git, CSS, and JS by doing.",
      icon: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 2l2.4 6.6L21 11l-6.6 2.4L12 20l-2.4-6.6L3 11l6.6-2.4z"/></svg>'
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

// ── Build quest filter pills (static HTML) ──

function buildQuestFilterPills() {
  const pills = ['              <button class="pill" type="button" data-cat="all" aria-pressed="true"><span class="pi" aria-hidden="true">\u25A6</span> All <span class="pill-count">(' + totalQuestCount + ')</span></button>'];
  questCategories.forEach((c) => {
    const count = questCountByCategory[c.id] || 0;
    if (count === 0) return;
    pills.push('              <button class="pill" type="button" data-cat="' + escapeAttr(c.id) + '" aria-pressed="false"><span class="pi" aria-hidden="true">' + c.icon + '</span> ' + escapeHtml(c.name) + ' <span class="pill-count">(' + count + ')</span></button>');
  });
  return pills.join("\n");
}

// ── Build quest cards (static HTML) ──

function buildQuestCards() {
  return questsDataBuilt.map((q) => {
    const cat = questCategoryMap[q.category];
    const diff = q.difficulty.toLowerCase();
    const searchData = (q.name + " " + q.shortDescription + " " + q.tags.join(" ")).toLowerCase();
    const liveUrl = site.url + "/quests/" + q.id;

    const thumbHtml = q.hasThumbnail
      ? '<img class="card-thumb" src="quests/' + escapeAttr(q.id) + '.png" alt="' + escapeAttr(q.name) + '" loading="lazy" />'
      : '<div class="card-thumb-placeholder">' + (cat ? cat.icon : '') + '</div>';

    return '            <article class="card" data-id="' + escapeAttr(q.id) + '" data-category="' + escapeAttr(q.category) + '" data-search="' + escapeAttr(searchData) + '" tabindex="0" role="button" aria-label="View details for ' + escapeAttr(q.name) + '">' +
      thumbHtml +
      '<div class="card-body">' +
      '<div class="card-top"><h4>' + escapeHtml(q.name) + '</h4>' +
      '<span class="badge-cat"><span aria-hidden="true">' + (cat ? cat.icon : '') + '</span> ' + escapeHtml(q.categoryName) + '</span></div>' +
      '<p class="desc">' + escapeHtml(q.shortDescription) + '</p>' +
      '<div class="path mono">quests/' + escapeHtml(q.id) + '.html</div>' +
      '<div class="card-foot">' +
      '<span class="badge-diff ' + diff + '">' + escapeHtml(q.difficulty) + '</span>' +
      '<span class="card-links">' +
      '<a class="link-btn" href="quests/' + escapeAttr(q.id) + '.html" data-nomodal>Preview</a>' +
      '<a class="link-btn primary" href="' + escapeAttr(liveUrl) + '" target="_blank" rel="noopener noreferrer" data-nomodal>Start Quest <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M7 17 17 7M9 7h8v8"/></svg></a>' +
      '</span></div></div></article>';
  }).join("\n");
}

// ── Build resume/portfolio showcase cards (static HTML) ──

function buildThemeCard(t, glyph) {
  const screenshotHtml = t.hasScreenshot
    ? '<img class="tc-screenshot" src="' + escapeAttr(t.screenshot) + '" alt="' + escapeAttr(t.name) + ' theme screenshot" loading="lazy" />'
    : '<div class="tc-screenshot-placeholder">' + glyph + '</div>';
  return '            <article class="theme-card">' +
    screenshotHtml +
    '<div class="tc-body">' +
    '<div class="tc-head"><span class="tc-glyph" aria-hidden="true">' + glyph + '</span><h4>' + escapeHtml(t.name) + '</h4></div>' +
    '<div class="path mono">' + escapeHtml(t.file) + '</div>' +
    '<p>' + escapeHtml(t.description) + '</p>' +
    '<a class="preview-btn" href="' + escapeAttr(t.file) + '" target="_blank" rel="noopener noreferrer">Preview <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="M7 17 17 7M9 7h8v8"/></svg></a>' +
    '</div></article>';
}

function buildResumeCards() {
  const glyph = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><path d="M14 2v6h6M9 13h6M9 17h4"/></svg>';
  return resumeThemes.map((t) => buildThemeCard(t, glyph)).join("\n");
}

function buildPortfolioCards() {
  const glyph = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="4" width="18" height="16" rx="2"/><path d="M3 9h18"/></svg>';
  return portfolioThemes.map((t) => buildThemeCard(t, glyph)).join("\n");
}

// Resume & portfolio theme data from themes.json
// Convention: [pillar]/themes/[id].hbs is the template, [id].png is the screenshot, [id].html is the output
const themesData = JSON.parse(fs.readFileSync(path.join(rootDir, "data", "themes.json"), "utf-8"));
function mapTheme(pillar) {
  return function (t) {
    var base = pillar + "/" + t.id;
    return {
      ...t,
      file: base + ".html",
      screenshot: base + ".png",
      hasScreenshot: fs.existsSync(path.join(rootDir, base + ".png"))
    };
  };
}
const resumeThemes = themesData.resume.map(mapTheme("resume"));
const portfolioThemes = themesData.portfolio.map(mapTheme("portfolio"));

// Build JSON data for the script block (used by modal + search)
const siteJson = JSON.stringify({ title: site.title, tagline: site.tagline, url: site.url, github: site.github });
const categoriesJson = JSON.stringify(categories.map((c) => ({ id: c.id, name: c.name, icon: c.icon })));
const toolsJson = JSON.stringify(toolsData.map((t) => ({
  id: t.id, name: t.name, shortDescription: t.shortDescription, longDescription: tools.find((x) => x.id === t.id)?.longDescription || "",
  category: t.category, tags: t.tags, techStack: t.techStack, difficulty: t.difficulty
})));
const resumeThemesJson = JSON.stringify(resumeThemes);
const portfolioThemesJson = JSON.stringify(portfolioThemes);
const questsJson = JSON.stringify(questsDataBuilt.map((q) => ({
  id: q.id, name: q.name, shortDescription: q.shortDescription, longDescription: quests.find((x) => x.id === q.id)?.longDescription || "",
  category: q.category, tags: q.tags, techStack: q.techStack, difficulty: q.difficulty
})));
const questCategoriesJson = JSON.stringify(questCategories.map((c) => ({ id: c.id, name: c.name, icon: c.icon })));

// ── Inject into template ──

let html = template
  .replace(/\{\{SITE_URL\}\}/g, escapeAttr(site.url))
  .replace(/\{\{GITHUB_URL\}\}/g, escapeAttr(site.github))
  .replace(/\{\{AUTHOR_URL\}\}/g, escapeAttr(site.author.url))
  .replace(/\{\{AUTHOR_NAME\}\}/g, escapeHtml(site.author.name))
  .replace(/\{\{SSOC_URL\}\}/g, escapeAttr(site.ssoc.url))
  .replace(/\{\{YEAR\}\}/g, new Date().getFullYear().toString())
  .replace(/\{\{TOOL_COUNT\}\}/g, String(totalCount))
  .replace(/\{\{QUEST_COUNT\}\}/g, String(totalQuestCount))
  .replace("{{PILLAR_CARDS}}", buildPillarCards())
  .replace("{{FILTER_PILLS}}", buildFilterPills())
  .replace("{{TOOL_CARDS}}", buildToolCards())
  .replace("{{RESUME_CARDS}}", buildResumeCards())
  .replace("{{PORTFOLIO_CARDS}}", buildPortfolioCards())
  .replace("{{QUEST_FILTER_PILLS}}", buildQuestFilterPills())
  .replace("{{QUEST_CARDS}}", buildQuestCards())
  .replace("{{SITE_JSON}}", siteJson)
  .replace("{{CATEGORIES_JSON}}", categoriesJson)
  .replace("{{TOOLS_JSON}}", toolsJson)
  .replace("{{RESUME_THEMES_JSON}}", resumeThemesJson)
  .replace("{{PORTFOLIO_THEMES_JSON}}", portfolioThemesJson)
  .replace("{{QUESTS_JSON}}", questsJson)
  .replace("{{QUEST_CATEGORIES_JSON}}", questCategoriesJson);

// ──────────────────────────────────────────────
// Write output
// ──────────────────────────────────────────────

const outPath = path.join(rootDir, "index.html");
fs.writeFileSync(outPath, html, "utf-8");

console.log("Built index.html successfully.");
console.log("  " + totalCount + " tools across " + categories.length + " categories (" + liveCount + " live, " + (totalCount - liveCount) + " ideas)");
console.log("  " + totalQuestCount + " quests across " + questCategories.length + " categories");
console.log("  Template: " + templatePath);
console.log("  Output: " + outPath);

