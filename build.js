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
  live: `tools/${tool.id}.html`
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
// HTML Generators for each design
// ──────────────────────────────────────────────

function sharedFooter() {
  return `
      <footer class="site-footer">
        <div class="footer-links">
          <a href="${escapeAttr(site.github)}">GitHub</a>
          <a href="Contributing.md">Contributing</a>
          <a href="${escapeAttr(site.ssoc.url)}">SSoC</a>
          <a href="${escapeAttr(site.ssoc.leaderboard)}">Leaderboard</a>
        </div>
        <p>Built by <a href="${escapeAttr(site.author.url)}">${escapeHtml(site.author.name)}</a>. Open source with purpose, one file at a time.</p>
      </footer>`;
}

// ── DESIGN 1: Tool Directory ──

function buildDesign1() {
  const cards = toolsData
    .map(
      (t) => `
        <div class="tool-card" data-id="${escapeAttr(t.id)}" data-category="${escapeAttr(t.category)}" data-tags="${escapeAttr(t.tags.join(","))}" data-search="${escapeAttr((t.name + " " + t.shortDescription + " " + t.tags.join(" ")).toLowerCase())}">
          ${t.hasThumbnail ? `<img class="tool-card-thumb" src="${escapeAttr(t.thumbnail)}" alt="${escapeAttr(t.name)}" loading="lazy" onerror="this.outerHTML='<div class=\\'tool-card-thumb-placeholder\\'>${t.categoryIcon}</div>'" />` : `<div class="tool-card-thumb-placeholder">${t.categoryIcon}</div>`}
          <div class="tool-card-body">
            <h3>${escapeHtml(t.name)}</h3>
            <p>${escapeHtml(t.shortDescription)}</p>
            <div class="tool-card-tags">
              <span class="tag tag-category">${escapeHtml(t.categoryName)}</span>
              <span class="tag tag-${t.difficulty.toLowerCase()}">${escapeHtml(t.difficulty)}</span>
              <span class="tag tag-${t.status}">${t.status === "live" ? "Live" : t.status === "in-progress" ? "In Progress" : "Idea"}</span>
            </div>
          </div>
        </div>`
    )
    .join("");

  const filterBtns = categories.map((c) => `<button class="filter-btn" data-category="${escapeAttr(c.id)}">${c.icon} ${escapeHtml(c.name)}</button>`).join("\n            ");

  const tagBtns = allTags.map((t) => `<button class="tag-filter-btn" data-tag="${escapeAttr(t)}">${escapeHtml(t)}</button>`).join("\n            ");

  return `
    <section id="d1" class="design-section active">
      <header class="d1-header">
        <h1>${escapeHtml(site.title)}</h1>
        <p>${escapeHtml(site.tagline)} No build step. No dependencies. No frameworks.</p>
        <div class="d1-search">
          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2"><circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35" stroke-linecap="round"/></svg>
          <input type="text" class="search-input" placeholder="Search tools..." autocomplete="off" />
        </div>
      </header>
      <div class="d1-filters filter-bar">
        <button class="filter-btn active" data-category="all">All</button>
        ${filterBtns}
      </div>
      <div class="d1-tags tag-bar">
        <span class="tag-bar-label">\uD83C\uDFF7\uFE0F Tags:</span>
        ${tagBtns}
      </div>
      <div class="results-count"></div>
      <div class="d1-grid tool-grid">${cards}
      </div>
      <div class="no-results">No tools found matching your search.</div>
      ${sharedFooter()}
    </section>`;
}

// ── DESIGN 2: Hero + Scroll ──

function buildDesign2() {
  const categoryBlocks = categories
    .map((cat) => {
      const catTools = toolsByCategory[cat.id] || [];
      if (catTools.length === 0) return "";
      const toolItems = catTools
        .map(
          (t) => `
            <div class="d2-tool tool-card" data-id="${escapeAttr(t.id)}" data-category="${escapeAttr(t.category)}" data-search="${escapeAttr((t.name + " " + t.shortDescription + " " + t.tags.join(" ")).toLowerCase())}">
              <div class="d2-tool-icon">${cat.icon}</div>
              <div class="d2-tool-info">
                <h4>${escapeHtml(t.name)}</h4>
                <p>${escapeHtml(t.shortDescription)}</p>
              </div>
            </div>`
        )
        .join("");
      return `
          <div class="d2-category">
            <h2>${cat.icon} ${escapeHtml(cat.name)}</h2>
            <div class="d2-category-grid">${toolItems}
            </div>
          </div>`;
    })
    .join("");

  return `
    <section id="d2" class="design-section">
      <div class="d2-hero">
        <div class="d2-hero-content">
          <h1>One tool.<br><span>One file.</span><br>Open and use.</h1>
          <p>${escapeHtml(site.description)}</p>
          <div class="d2-hero-buttons">
            <a href="#d2-tools" class="d2-btn-primary">Browse Tools</a>
            <a href="${escapeAttr(site.github)}" class="d2-btn-secondary">View on GitHub</a>
            <a href="Contributing.md" class="d2-btn-secondary">Contribute</a>
          </div>
        </div>
      </div>
      <div class="d2-stats">
        <div class="d2-stat"><div class="num">${totalCount}+</div><div class="label">Tool Ideas</div></div>
        <div class="d2-stat"><div class="num">${categories.length}</div><div class="label">Categories</div></div>
        <div class="d2-stat"><div class="num">0 KB</div><div class="label">npm install</div></div>
        <div class="d2-stat"><div class="num">100%</div><div class="label">Browser-based</div></div>
      </div>
      <div id="d2-tools" class="d2-categories">${categoryBlocks}
      </div>
      ${sharedFooter()}
    </section>`;
}

// ── DESIGN 3: Interactive Showcase ──

function buildDesign3() {
  const categoryCards = categories
    .map((cat) => {
      const count = (toolsByCategory[cat.id] || []).length;
      return `
          <div class="d3-cat-card">
            <div class="icon">${cat.icon}</div>
            <h3>${escapeHtml(cat.name)}</h3>
            <p>${escapeHtml(cat.description)}</p>
            <span class="count">${count} tool${count !== 1 ? "s" : ""}</span>
          </div>`;
    })
    .join("");

  return `
    <section id="d3" class="design-section">
      <div class="d3-hero">
        <h1>${escapeHtml(site.title)}</h1>
        <p>Try a tool right here. Every tool is a single HTML file you can download and use anywhere.</p>
      </div>
      <div class="d3-preview">
        <div class="d3-preview-header">
          <div class="d3-preview-dot"></div>
          <div class="d3-preview-dot"></div>
          <div class="d3-preview-dot"></div>
          <span style="margin-left:0.5rem;font-size:0.8rem;color:var(--text-muted)">json-formatter.html</span>
        </div>
        <div class="d3-preview-body">
          <textarea id="d3-json-input" placeholder='Paste JSON here, e.g. {"name":"One File Tools","type":"awesome"}'></textarea>
          <button onclick="formatJSON()">Format JSON</button>
          <pre id="d3-json-output">Formatted output will appear here...</pre>
        </div>
      </div>
      <div class="d3-ssoc-banner">
        <div class="d3-ssoc-inner">
          \uD83C\uDF93 Part of <a href="${escapeAttr(site.ssoc.url)}">Social Summer of Code</a> &mdash; Easy: 20 pts &middot; Medium: 30 pts &middot; <a href="${escapeAttr(site.ssoc.leaderboard)}">Leaderboard</a>
        </div>
      </div>
      <div class="d3-category-cards">${categoryCards}
      </div>
      ${sharedFooter()}
    </section>`;
}

// ── DESIGN 4: Terminal / Dev ──

function buildDesign4() {
  const sections = categories
    .map((cat) => {
      const catTools = toolsByCategory[cat.id] || [];
      if (catTools.length === 0) return "";
      const items = catTools
        .map(
          (t) => `
              <li class="tool-card" data-id="${escapeAttr(t.id)}">
                <span class="name">${escapeHtml(t.id)}</span>
                <span class="desc">${escapeHtml(t.shortDescription)}</span>
                <span class="diff diff-${t.difficulty.toLowerCase()}">${t.difficulty === "Easy" ? "EASY" : "MED"}</span>
              </li>`
        )
        .join("");
      return `
          <div class="d4-section">
            <div class="d4-section-header">// ${escapeHtml(cat.name)}</div>
            <ul class="d4-list">${items}
            </ul>
          </div>`;
    })
    .join("");

  return `
    <section id="d4" class="design-section">
      <div class="d4-wrap">
        <div class="d4-header">
          <pre class="d4-ascii">
  ___  _  _ ___   ___ ___ _    ___   _____ ___   ___  _    ___
 / _ \\| \\| | __| | __|_ _| |  | __| |_   _/ _ \\ / _ \\| |  / __|
| (_) | .\` | _|  | _| | || |__| _|    | || (_) | (_) | |__\\__ \\
 \\___/|_|\\_|___| |_| |___|____|___|   |_| \\___/ \\___/|____|___/
          </pre>
          <div class="d4-prompt">~/one-file-tools $</div>
          <h1>${escapeHtml(site.title)}</h1>
          <p>${escapeHtml(site.tagline)} Zero dependencies.</p>
          <div class="d4-cmd"><span>$</span> open tools/json-formatter.html</div>
          <br>
          <div class="d4-cmd"><span>$</span> # That's it. No npm. No build. No server.</div>
        </div>
        <div class="d4-body">${sections}
          <div class="d4-section">
            <div class="d4-section-header">// Links</div>
            <ul class="d4-list">
              <li><a href="${escapeAttr(site.github)}" style="color:#4ade80">GitHub Repository</a></li>
              <li><a href="Contributing.md" style="color:#4ade80">Contributing Guide</a></li>
              <li><a href="${escapeAttr(site.ssoc.url)}" style="color:#4ade80">SSoC Portal</a></li>
              <li><a href="${escapeAttr(site.author.url)}" style="color:#4ade80">${escapeHtml(site.author.name)}</a></li>
            </ul>
          </div>
        </div>
      </div>
    </section>`;
}

// ── DESIGN 5: Bento Grid ──

function buildDesign5() {
  const catCells = categories
    .slice(0, 4)
    .map((cat) => {
      const catTools = toolsByCategory[cat.id] || [];
      const toolList = catTools
        .slice(0, 4)
        .map((t) => `<li>${escapeHtml(t.name)}</li>`)
        .join("");
      return `
          <div class="d5-cell">
            <div class="icon">${cat.icon}</div>
            <h3>${escapeHtml(cat.name)}</h3>
            <ul class="d5-tool-list">${toolList}</ul>
          </div>`;
    })
    .join("");

  return `
    <section id="d5" class="design-section">
      <div class="d5-container">
        <div class="d5-grid">
          <div class="d5-cell hero-cell">
            <h1>${escapeHtml(site.title)}</h1>
            <p>${escapeHtml(site.tagline)} No build step. No dependencies. No frameworks.</p>
          </div>
          <div class="d5-cell d5-stat-cell"><div class="num">${totalCount}+</div><div class="label">Tool Ideas</div></div>
          <div class="d5-cell d5-stat-cell"><div class="num">${categories.length}</div><div class="label">Categories</div></div>
          <div class="d5-cell d5-stat-cell"><div class="num">${liveCount}</div><div class="label">Live Tools</div></div>
          <div class="d5-cell d5-stat-cell"><div class="num">0</div><div class="label">Dependencies</div></div>
          <div class="d5-cell span-2">
            <div class="icon">\uD83D\uDCA1</div>
            <h3>Philosophy</h3>
            <div class="d5-philosophy">
              <strong>One file.</strong> Each tool is a single .html file.<br>
              <strong>Zero build.</strong> No npm install, no bundler, no server.<br>
              <strong>Browser only.</strong> Runs entirely client-side.<br>
              <strong>Open source.</strong> Unlicense. Do what you want.
            </div>
          </div>
          <div class="d5-cell span-2 d5-cta-cell">
            <h3>Start Contributing</h3>
            <p style="color:var(--text-muted);font-size:0.9rem">Pick a tool, build it in a single HTML file, and submit a PR.</p>
            <div style="display:flex;gap:0.75rem;flex-wrap:wrap;justify-content:center">
              <a href="${escapeAttr(site.github)}" class="d5-btn-primary">GitHub</a>
              <a href="Contributing.md" class="d5-btn-outline">Contributing Guide</a>
            </div>
          </div>
          ${catCells}
          <div class="d5-cell span-4" style="text-align:center">
            <div class="icon">\uD83C\uDF93</div>
            <h3>SSoC (Social Summer of Code)</h3>
            <p style="color:var(--text-muted);font-size:0.9rem;max-width:600px;margin:0 auto">
              This project is part of Social Summer of Code. Pick an Easy (20 pts) or Medium (30 pts) issue, build a tool, and earn contribution points.
              <a href="${escapeAttr(site.ssoc.url)}">Learn more</a> &middot; <a href="${escapeAttr(site.ssoc.leaderboard)}">Leaderboard</a>
            </p>
          </div>
        </div>
      </div>
      ${sharedFooter()}
    </section>`;
}

// ──────────────────────────────────────────────
// Full HTML template
// ──────────────────────────────────────────────

const html = `<!DOCTYPE html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>${escapeHtml(site.title)} - ${escapeHtml(site.tagline)}</title>
    <meta name="title" content="${escapeAttr(site.title)} - ${escapeAttr(site.tagline)}" />
    <meta name="description" content="${escapeAttr(site.description)}" />
    <meta name="keywords" content="developer tools, html tools, single file, no dependencies, open source, web tools, SEO, JSON, CSS, accessibility" />
    <meta property="og:title" content="${escapeAttr(site.title)} - ${escapeAttr(site.tagline)}" />
    <meta property="og:site_name" content="${escapeAttr(site.title)}" />
    <meta property="og:url" content="${escapeAttr(site.url)}/" />
    <meta property="og:description" content="${escapeAttr(site.description)}" />
    <meta property="og:type" content="website" />
    <meta property="og:image" content="${escapeAttr(site.url)}/thumb.png" />
    <meta property="twitter:card" content="summary_large_image" />
    <meta property="twitter:url" content="${escapeAttr(site.url)}/" />
    <meta property="twitter:title" content="${escapeAttr(site.title)} - ${escapeAttr(site.tagline)}" />
    <meta property="twitter:description" content="${escapeAttr(site.description)}" />
    <meta property="twitter:image" content="${escapeAttr(site.url)}/thumb.png" />
    <link rel="shortcut icon" type="image/svg+xml" href="data:image/svg+xml,<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 100 100'><text y='.9em' font-size='90'>\uD83D\uDEE0\uFE0F</text></svg>" />
    <style>
      /* ========================================
         Custom Properties
         ======================================== */
      :root {
        --bg: #fafafa;
        --bg-card: #ffffff;
        --bg-card-hover: #f5f5f5;
        --bg-hero: #0a0a0a;
        --bg-overlay: rgba(0,0,0,0.6);
        --text: #1a1a1a;
        --text-muted: #6b7280;
        --text-hero: #ffffff;
        --text-hero-muted: #a1a1aa;
        --accent: #3b82f6;
        --accent-hover: #2563eb;
        --border: #e5e7eb;
        --tag-bg: #e0e7ff;
        --tag-text: #3730a3;
        --easy-bg: #d1fae5;
        --easy-text: #065f46;
        --medium-bg: #fef3c7;
        --medium-text: #92400e;
        --live-bg: #d1fae5;
        --live-text: #065f46;
        --idea-bg: #f3f4f6;
        --idea-text: #6b7280;
        --in-progress-bg: #dbeafe;
        --in-progress-text: #1e40af;
        --radius: 12px;
        --radius-sm: 8px;
        --shadow: 0 1px 3px rgba(0,0,0,0.08), 0 1px 2px rgba(0,0,0,0.06);
        --shadow-lg: 0 10px 40px rgba(0,0,0,0.08);
        --shadow-xl: 0 20px 60px rgba(0,0,0,0.12);
        --font: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Oxygen, Ubuntu, Cantarell, sans-serif;
        --font-mono: "SF Mono", SFMono-Regular, ui-monospace, Menlo, Consolas, monospace;
        --transition: 0.2s ease;
      }

      [data-theme="dark"] {
        --bg: #0a0a0a;
        --bg-card: #18181b;
        --bg-card-hover: #27272a;
        --bg-overlay: rgba(0,0,0,0.75);
        --text: #fafafa;
        --text-muted: #a1a1aa;
        --border: #27272a;
        --tag-bg: #1e1b4b;
        --tag-text: #a5b4fc;
        --easy-bg: #064e3b;
        --easy-text: #6ee7b7;
        --medium-bg: #78350f;
        --medium-text: #fde68a;
        --live-bg: #064e3b;
        --live-text: #6ee7b7;
        --idea-bg: #27272a;
        --idea-text: #a1a1aa;
        --in-progress-bg: #1e3a5f;
        --in-progress-text: #93c5fd;
        --shadow: 0 1px 3px rgba(0,0,0,0.3);
        --shadow-lg: 0 10px 40px rgba(0,0,0,0.4);
        --shadow-xl: 0 20px 60px rgba(0,0,0,0.5);
      }

      /* ========================================
         Reset
         ======================================== */
      *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
      html { scroll-behavior: smooth; }
      body { font-family: var(--font); line-height: 1.6; color: var(--text); background: var(--bg); -webkit-font-smoothing: antialiased; padding-top: 52px; }
      a { color: var(--accent); text-decoration: none; }
      a:hover { text-decoration: underline; }

      /* ========================================
         Design Switcher
         ======================================== */
      .design-switcher {
        position: fixed; top: 0; left: 0; right: 0; z-index: 1000;
        background: #18181b; border-bottom: 1px solid #27272a;
        padding: 0.6rem 1.5rem;
        display: flex; align-items: center; gap: 0.75rem; flex-wrap: wrap;
      }
      .design-switcher label { color: #a1a1aa; font-size: 0.75rem; font-weight: 600; text-transform: uppercase; letter-spacing: 0.05em; white-space: nowrap; }
      .design-switcher .buttons { display: flex; gap: 0.4rem; flex-wrap: wrap; }
      .design-switcher button {
        font-family: var(--font); font-size: 0.75rem; padding: 0.35rem 0.75rem;
        border: 1px solid #3f3f46; border-radius: 6px; background: transparent;
        color: #d4d4d8; cursor: pointer; transition: all 0.2s; white-space: nowrap;
      }
      .design-switcher button:hover { background: #27272a; border-color: #52525b; }
      .design-switcher button.active { background: var(--accent); border-color: var(--accent); color: white; }
      .design-switcher .theme-toggle {
        margin-left: auto; background: none; border: 1px solid #3f3f46;
        font-size: 1rem; padding: 0.3rem 0.5rem; cursor: pointer;
        border-radius: 6px; color: #d4d4d8; line-height: 1;
      }
      .design-switcher .theme-toggle:hover { background: #27272a; }

      /* ========================================
         Design sections
         ======================================== */
      .design-section { display: none; }
      .design-section.active { display: block; }

      /* ========================================
         Shared Tags
         ======================================== */
      .tag { display: inline-block; font-size: 0.68rem; font-weight: 600; padding: 0.18rem 0.5rem; border-radius: 4px; text-transform: uppercase; letter-spacing: 0.03em; }
      .tag-category { background: var(--tag-bg); color: var(--tag-text); }
      .tag-easy { background: var(--easy-bg); color: var(--easy-text); }
      .tag-medium { background: var(--medium-bg); color: var(--medium-text); }
      .tag-live { background: var(--live-bg); color: var(--live-text); }
      .tag-idea { background: var(--idea-bg); color: var(--idea-text); }
      .tag-in-progress { background: var(--in-progress-bg); color: var(--in-progress-text); }

      /* ========================================
         Shared: Search, Filter, Card, Grid, Footer, No-results
         ======================================== */
      .search-input {
        width: 100%; padding: 0.7rem 1rem 0.7rem 2.6rem;
        border: 1px solid var(--border); border-radius: var(--radius);
        background: var(--bg-card); color: var(--text); font-size: 0.9rem;
        font-family: var(--font); outline: none; transition: border-color var(--transition);
      }
      .search-input:focus { border-color: var(--accent); box-shadow: 0 0 0 3px rgba(59,130,246,0.1); }

      .filter-btn {
        font-family: var(--font); font-size: 0.8rem; padding: 0.35rem 0.8rem;
        border: 1px solid var(--border); border-radius: 20px; background: var(--bg-card);
        color: var(--text-muted); cursor: pointer; transition: all var(--transition); white-space: nowrap;
      }
      .filter-btn:hover { border-color: var(--accent); color: var(--accent); }
      .filter-btn.active { background: var(--accent); color: #fff; border-color: var(--accent); }

      .tool-card { cursor: pointer; transition: all var(--transition); }

      .tool-card-thumb { width: 100%; height: 180px; object-fit: cover; background: var(--bg-card-hover); display: block; }
      .tool-card-thumb-placeholder { width: 100%; height: 180px; background: var(--bg-card-hover); display: flex; align-items: center; justify-content: center; font-size: 2.5rem; color: var(--text-muted); user-select: none; }

      .no-results { text-align: center; padding: 3rem 1rem; color: var(--text-muted); font-size: 1rem; display: none; }
      .results-count { text-align: center; font-size: 0.8rem; color: var(--text-muted); margin: 0.5rem 0; }

      .site-footer { text-align: center; padding: 2rem 1.5rem; border-top: 1px solid var(--border); color: var(--text-muted); font-size: 0.83rem; }
      .site-footer a { color: var(--text); font-weight: 600; }
      .site-footer a:hover { color: var(--accent); }
      .footer-links { display: flex; justify-content: center; gap: 1.5rem; margin-bottom: 0.5rem; flex-wrap: wrap; }

      /* ========================================
         Modal
         ======================================== */
      .modal-overlay {
        display: none; position: fixed; inset: 0; z-index: 2000;
        background: var(--bg-overlay); backdrop-filter: blur(4px); -webkit-backdrop-filter: blur(4px);
        padding: 2rem 1rem; overflow-y: auto;
      }
      .modal-overlay.open { display: flex; align-items: flex-start; justify-content: center; }
      .modal {
        background: var(--bg-card); border: 1px solid var(--border); border-radius: var(--radius);
        max-width: 700px; width: 100%; margin-top: 2vh; box-shadow: var(--shadow-xl);
        overflow: hidden; animation: modalIn 0.25s ease;
      }
      @keyframes modalIn { from { opacity:0; transform: translateY(16px) scale(0.98); } to { opacity:1; transform: translateY(0) scale(1); } }
      .modal-thumb { width: 100%; height: 260px; object-fit: cover; background: var(--bg-card-hover); display: block; }
      .modal-thumb-placeholder { width: 100%; height: 200px; background: var(--bg-card-hover); display: flex; align-items: center; justify-content: center; font-size: 4rem; color: var(--text-muted); }
      .modal-header { padding: 1.5rem 1.75rem 0; display: flex; justify-content: space-between; align-items: flex-start; gap: 1rem; }
      .modal-header h2 { font-size: 1.4rem; font-weight: 700; }
      .modal-close { background: var(--bg-card-hover); border: 1px solid var(--border); border-radius: 8px; width: 36px; height: 36px; display: flex; align-items: center; justify-content: center; cursor: pointer; font-size: 1.2rem; color: var(--text-muted); transition: all var(--transition); flex-shrink: 0; }
      .modal-close:hover { background: var(--border); color: var(--text); }
      .modal-meta { padding: 0.75rem 1.75rem; display: flex; gap: 0.4rem; flex-wrap: wrap; }
      .modal-links { padding: 0 1.75rem; display: flex; gap: 0.6rem; flex-wrap: wrap; }
      .modal-links .btn { font-size: 0.82rem; padding: 0.5rem 1rem; display: inline-flex; align-items: center; gap: 0.3rem; border-radius: var(--radius-sm); font-weight: 600; font-family: var(--font); transition: all var(--transition); text-decoration: none; border: none; cursor: pointer; }
      .modal-links .btn:hover { text-decoration: none; }
      .modal-links .btn-primary { background: var(--accent); color: #fff; }
      .modal-links .btn-primary:hover { background: var(--accent-hover); }
      .modal-links .btn-outline { background: transparent; color: var(--accent); border: 1px solid var(--accent); }
      .modal-links .btn-outline:hover { background: var(--accent); color: #fff; }
      .modal-body { padding: 1.25rem 1.75rem 1.75rem; }
      .modal-body h2 { font-size: 1.2rem; font-weight: 700; margin: 1rem 0 0.5rem; }
      .modal-body h3 { font-size: 1rem; font-weight: 650; margin: 1rem 0 0.4rem; }
      .modal-body p { font-size: 0.9rem; color: var(--text-muted); margin-bottom: 0.75rem; }
      .modal-body ul, .modal-body ol { padding-left: 1.25rem; margin-bottom: 0.75rem; }
      .modal-body li { font-size: 0.9rem; color: var(--text-muted); margin-bottom: 0.25rem; }
      .modal-body code { font-family: var(--font-mono); font-size: 0.85em; background: var(--bg-card-hover); padding: 0.15rem 0.35rem; border-radius: 4px; }
      .modal-body pre { background: var(--bg-card-hover); border: 1px solid var(--border); border-radius: var(--radius-sm); padding: 1rem; overflow-x: auto; margin-bottom: 0.75rem; }
      .modal-body pre code { background: none; padding: 0; }
      .modal-section { border-top: 1px solid var(--border); padding: 1rem 1.75rem; }
      .modal-section-title { font-size: 0.7rem; font-weight: 700; text-transform: uppercase; letter-spacing: 0.06em; color: var(--text-muted); margin-bottom: 0.5rem; }
      .tech-stack { display: flex; gap: 0.35rem; flex-wrap: wrap; }
      .tech-badge { font-size: 0.75rem; padding: 0.2rem 0.6rem; background: var(--bg-card-hover); border: 1px solid var(--border); border-radius: 4px; color: var(--text); font-family: var(--font-mono); }
      .modal-tags { display: flex; gap: 0.35rem; flex-wrap: wrap; }
      .modal-tag { font-size: 0.75rem; padding: 0.2rem 0.5rem; background: var(--tag-bg); color: var(--tag-text); border-radius: 4px; }

      /* ========================================
         DESIGN 1: Tool Directory
         ======================================== */
      .d1-header { text-align: center; padding: 3rem 1.5rem 1.5rem; }
      .d1-header h1 { font-size: 2rem; font-weight: 700; margin-bottom: 0.5rem; }
      .d1-header p { color: var(--text-muted); font-size: 1.05rem; max-width: 500px; margin: 0 auto 1.5rem; }
      .d1-search { max-width: 480px; margin: 0 auto; position: relative; }
      .d1-search svg { position: absolute; left: 0.9rem; top: 50%; transform: translateY(-50%); width: 18px; height: 18px; color: var(--text-muted); pointer-events: none; }
      .d1-filters { display: flex; justify-content: center; gap: 0.4rem; flex-wrap: wrap; padding: 0 1.5rem 0.75rem; }
      .d1-tags { display: flex; justify-content: center; align-items: center; gap: 0.35rem; flex-wrap: wrap; padding: 0 1.5rem 1.5rem; }
      .tag-bar-label { font-size: 0.75rem; color: var(--text-muted); font-weight: 600; margin-right: 0.25rem; white-space: nowrap; }
      .tag-filter-btn { font-family: var(--font); font-size: 0.72rem; padding: 0.25rem 0.6rem; border: 1px solid var(--border); border-radius: 4px; background: var(--bg-card); color: var(--text-muted); cursor: pointer; transition: all var(--transition); white-space: nowrap; }
      .tag-filter-btn:hover { border-color: var(--accent); color: var(--accent); }
      .tag-filter-btn.active { background: var(--tag-bg); color: var(--tag-text); border-color: var(--tag-bg); }
      .d1-grid { max-width: 1140px; margin: 0 auto; padding: 0 1.5rem 3rem; display: grid; grid-template-columns: repeat(auto-fill, minmax(320px, 1fr)); gap: 1rem; }
      .d1-grid .tool-card { background: var(--bg-card); border: 1px solid var(--border); border-radius: var(--radius); overflow: hidden; display: flex; flex-direction: column; }
      .d1-grid .tool-card:hover { box-shadow: var(--shadow-lg); transform: translateY(-3px); border-color: var(--accent); }
      .d1-grid .tool-card-body { padding: 1.1rem 1.25rem; flex: 1; display: flex; flex-direction: column; }
      .d1-grid .tool-card-body h3 { font-size: 1rem; font-weight: 650; margin-bottom: 0.3rem; }
      .d1-grid .tool-card-body p { font-size: 0.83rem; color: var(--text-muted); margin-bottom: 0.75rem; flex: 1; display: -webkit-box; -webkit-line-clamp: 2; -webkit-box-orient: vertical; overflow: hidden; }
      .d1-grid .tool-card-tags { display: flex; gap: 0.35rem; flex-wrap: wrap; }

      /* ========================================
         DESIGN 2: Hero + Scroll
         ======================================== */
      .d2-hero { background: var(--bg-hero); padding: 6rem 1.5rem; text-align: center; position: relative; overflow: hidden; }
      .d2-hero::before { content: ""; position: absolute; top: -50%; left: -50%; width: 200%; height: 200%; background: radial-gradient(circle at 30% 50%, rgba(59,130,246,0.08) 0%, transparent 50%), radial-gradient(circle at 70% 50%, rgba(168,85,247,0.06) 0%, transparent 50%); animation: d2glow 15s ease-in-out infinite alternate; pointer-events: none; }
      @keyframes d2glow { 0%{transform:translate(0,0)} 100%{transform:translate(2%,-2%)} }
      .d2-hero-content { position: relative; z-index: 1; }
      .d2-hero h1 { font-size: clamp(2.5rem,6vw,4rem); font-weight: 800; color: var(--text-hero); margin-bottom: 1rem; letter-spacing: -0.03em; line-height: 1.1; }
      .d2-hero h1 span { background: linear-gradient(135deg,#3b82f6,#8b5cf6); -webkit-background-clip: text; -webkit-text-fill-color: transparent; background-clip: text; }
      .d2-hero p { color: var(--text-hero-muted); font-size: 1.15rem; max-width: 550px; margin: 0 auto 2rem; }
      .d2-hero-buttons { display: flex; gap: 0.75rem; justify-content: center; flex-wrap: wrap; }
      .d2-hero-buttons a { padding: 0.75rem 1.5rem; border-radius: var(--radius-sm); font-weight: 600; font-size: 0.95rem; transition: all 0.2s; text-decoration: none; }
      .d2-btn-primary { background: var(--accent); color: white; }
      .d2-btn-primary:hover { background: var(--accent-hover); text-decoration: none; }
      .d2-btn-secondary { background: rgba(255,255,255,0.08); color: white; border: 1px solid rgba(255,255,255,0.15); }
      .d2-btn-secondary:hover { background: rgba(255,255,255,0.12); text-decoration: none; }
      .d2-stats { display: flex; justify-content: center; gap: 3rem; padding: 3rem 1.5rem; max-width: 700px; margin: 0 auto; flex-wrap: wrap; }
      .d2-stat { text-align: center; }
      .d2-stat .num { font-size: 2.5rem; font-weight: 800; color: var(--accent); line-height: 1; }
      .d2-stat .label { font-size: 0.85rem; color: var(--text-muted); margin-top: 0.3rem; }
      .d2-categories { max-width: 1100px; margin: 0 auto; padding: 0 1.5rem 4rem; }
      .d2-category { margin-bottom: 3rem; }
      .d2-category h2 { font-size: 1.3rem; font-weight: 700; margin-bottom: 1rem; padding-bottom: 0.5rem; border-bottom: 1px solid var(--border); }
      .d2-category-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(300px, 1fr)); gap: 0.75rem; }
      .d2-tool { display: flex; align-items: center; gap: 0.75rem; padding: 0.85rem 1rem; background: var(--bg-card); border: 1px solid var(--border); border-radius: var(--radius-sm); }
      .d2-tool:hover { background: var(--bg-card-hover); transform: translateX(4px); }
      .d2-tool-icon { width: 36px; height: 36px; border-radius: 8px; background: var(--tag-bg); display: flex; align-items: center; justify-content: center; font-size: 1.1rem; flex-shrink: 0; }
      .d2-tool-info h4 { font-size: 0.9rem; font-weight: 600; }
      .d2-tool-info p { font-size: 0.78rem; color: var(--text-muted); display: -webkit-box; -webkit-line-clamp: 1; -webkit-box-orient: vertical; overflow: hidden; }

      /* ========================================
         DESIGN 3: Interactive Showcase
         ======================================== */
      .d3-hero { padding: 4rem 1.5rem 2rem; text-align: center; }
      .d3-hero h1 { font-size: clamp(2rem,5vw,3rem); font-weight: 800; margin-bottom: 0.75rem; letter-spacing: -0.02em; }
      .d3-hero p { color: var(--text-muted); font-size: 1.1rem; max-width: 520px; margin: 0 auto; }
      .d3-preview { max-width: 700px; margin: 2rem auto; background: var(--bg-card); border: 1px solid var(--border); border-radius: var(--radius); overflow: hidden; box-shadow: var(--shadow-lg); }
      .d3-preview-header { display: flex; align-items: center; gap: 0.5rem; padding: 0.75rem 1rem; background: var(--bg-card-hover); border-bottom: 1px solid var(--border); }
      .d3-preview-dot { width: 10px; height: 10px; border-radius: 50%; }
      .d3-preview-dot:nth-child(1) { background: #ef4444; }
      .d3-preview-dot:nth-child(2) { background: #eab308; }
      .d3-preview-dot:nth-child(3) { background: #22c55e; }
      .d3-preview-body { padding: 2rem; min-height: 200px; display: flex; flex-direction: column; align-items: center; justify-content: center; gap: 1rem; }
      .d3-preview-body textarea { width: 100%; max-width: 500px; height: 80px; padding: 0.75rem; border: 1px solid var(--border); border-radius: var(--radius-sm); font-family: var(--font-mono); font-size: 0.85rem; background: var(--bg); color: var(--text); resize: vertical; }
      .d3-preview-body button { font-family: var(--font); padding: 0.6rem 1.5rem; background: var(--accent); color: white; border: none; border-radius: var(--radius-sm); font-weight: 600; cursor: pointer; transition: background 0.2s; }
      .d3-preview-body button:hover { background: var(--accent-hover); }
      .d3-preview-body pre { width: 100%; max-width: 500px; padding: 0.75rem; background: var(--bg); border: 1px solid var(--border); border-radius: var(--radius-sm); font-family: var(--font-mono); font-size: 0.8rem; color: var(--text); overflow-x: auto; text-align: left; white-space: pre-wrap; min-height: 40px; }
      .d3-ssoc-banner { max-width: 700px; margin: 0 auto 2rem; padding: 0 1.5rem; }
      .d3-ssoc-inner { background: var(--bg-card); border: 1px solid var(--border); border-radius: var(--radius-sm); padding: 0.85rem 1.25rem; font-size: 0.88rem; color: var(--text-muted); text-align: center; }
      .d3-category-cards { max-width: 1000px; margin: 0 auto; padding: 0 1.5rem 4rem; display: grid; grid-template-columns: repeat(auto-fill, minmax(220px, 1fr)); gap: 1.25rem; }
      .d3-cat-card { background: var(--bg-card); border: 1px solid var(--border); border-radius: var(--radius); padding: 1.5rem; transition: all 0.25s; cursor: default; }
      .d3-cat-card:hover { box-shadow: var(--shadow-lg); transform: translateY(-4px); }
      .d3-cat-card .icon { font-size: 1.8rem; margin-bottom: 0.75rem; }
      .d3-cat-card h3 { font-size: 1.05rem; font-weight: 700; margin-bottom: 0.35rem; }
      .d3-cat-card p { font-size: 0.82rem; color: var(--text-muted); margin-bottom: 0.75rem; }
      .d3-cat-card .count { font-size: 0.8rem; color: var(--accent); font-weight: 600; }

      /* ========================================
         DESIGN 4: Terminal
         ======================================== */
      .d4-wrap { background: #0c0c0c; color: #d4d4d4; min-height: 100vh; font-family: var(--font-mono); }
      .d4-header { padding: 3rem 1.5rem; max-width: 800px; margin: 0 auto; }
      .d4-prompt { color: #4ade80; font-size: 0.85rem; margin-bottom: 0.25rem; }
      .d4-header h1 { font-size: clamp(1.5rem,4vw,2.2rem); font-weight: 700; color: #fafafa; margin-bottom: 0.5rem; font-family: var(--font-mono); }
      .d4-header p { color: #6b7280; font-size: 0.9rem; margin-bottom: 1.5rem; }
      .d4-cmd { display: inline-block; background: #1a1a1a; border: 1px solid #2a2a2a; border-radius: 6px; padding: 0.6rem 1rem; font-size: 0.85rem; color: #d4d4d4; margin-bottom: 0.5rem; }
      .d4-cmd span { color: #4ade80; }
      .d4-body { max-width: 800px; margin: 0 auto; padding: 0 1.5rem 4rem; }
      .d4-section { margin-bottom: 2.5rem; }
      .d4-section-header { color: #4ade80; font-size: 0.8rem; text-transform: uppercase; letter-spacing: 0.1em; margin-bottom: 0.75rem; padding-bottom: 0.4rem; border-bottom: 1px solid #1e1e1e; }
      .d4-list { list-style: none; }
      .d4-list li { padding: 0.5rem 0; border-bottom: 1px solid #1a1a1a; display: flex; justify-content: space-between; align-items: center; gap: 1rem; font-size: 0.85rem; }
      .d4-list li:last-child { border-bottom: none; }
      .d4-list .name { color: #fafafa; font-weight: 600; white-space: nowrap; }
      .d4-list .desc { color: #6b7280; font-size: 0.8rem; flex: 1; display: -webkit-box; -webkit-line-clamp: 1; -webkit-box-orient: vertical; overflow: hidden; }
      .d4-list .diff { font-size: 0.7rem; padding: 0.15rem 0.5rem; border-radius: 3px; flex-shrink: 0; }
      .d4-list .diff-easy { background: #064e3b; color: #6ee7b7; }
      .d4-list .diff-medium { background: #78350f; color: #fde68a; }
      .d4-ascii { color: #4ade80; font-size: 0.6rem; line-height: 1.2; margin-bottom: 1.5rem; white-space: pre; overflow-x: auto; }

      /* ========================================
         DESIGN 5: Bento Grid
         ======================================== */
      .d5-container { max-width: 1100px; margin: 0 auto; padding: 2rem 1.5rem 2rem; }
      .d5-grid { display: grid; grid-template-columns: repeat(4, 1fr); gap: 1rem; }
      .d5-cell { background: var(--bg-card); border: 1px solid var(--border); border-radius: var(--radius); padding: 1.5rem; transition: all 0.25s; }
      .d5-cell:hover { box-shadow: var(--shadow); }
      .d5-cell.span-2 { grid-column: span 2; }
      .d5-cell.span-3 { grid-column: span 3; }
      .d5-cell.span-4 { grid-column: span 4; }
      .d5-cell.hero-cell { grid-column: span 4; text-align: center; padding: 3.5rem 2rem; background: var(--bg-hero); color: var(--text-hero); border-color: #27272a; }
      .d5-cell.hero-cell h1 { font-size: clamp(2rem,5vw,3rem); font-weight: 800; margin-bottom: 0.5rem; letter-spacing: -0.02em; }
      .d5-cell.hero-cell p { color: var(--text-hero-muted); font-size: 1.05rem; }
      .d5-stat-cell { text-align: center; }
      .d5-stat-cell .num { font-size: 2rem; font-weight: 800; color: var(--accent); }
      .d5-stat-cell .label { font-size: 0.8rem; color: var(--text-muted); margin-top: 0.2rem; }
      .d5-cell h3 { font-size: 1rem; font-weight: 700; margin-bottom: 0.75rem; }
      .d5-cell .icon { font-size: 1.5rem; margin-bottom: 0.5rem; }
      .d5-tool-list { list-style: none; }
      .d5-tool-list li { font-size: 0.85rem; padding: 0.3rem 0; color: var(--text-muted); }
      .d5-philosophy { font-size: 0.9rem; line-height: 1.8; }
      .d5-philosophy strong { color: var(--accent); }
      .d5-cta-cell { display: flex; flex-direction: column; align-items: center; justify-content: center; text-align: center; gap: 0.75rem; }
      .d5-btn-primary { display: inline-block; padding: 0.65rem 1.5rem; background: var(--accent); color: white; border-radius: var(--radius-sm); font-weight: 600; font-size: 0.9rem; text-decoration: none; transition: background 0.2s; }
      .d5-btn-primary:hover { background: var(--accent-hover); text-decoration: none; }
      .d5-btn-outline { display: inline-block; padding: 0.65rem 1.5rem; background: transparent; border: 1px solid var(--border); color: var(--text); border-radius: var(--radius-sm); font-weight: 600; font-size: 0.9rem; text-decoration: none; transition: all 0.2s; }
      .d5-btn-outline:hover { border-color: var(--accent); color: var(--accent); text-decoration: none; }

      /* ========================================
         Responsive
         ======================================== */
      @media (max-width: 768px) {
        .d5-grid { grid-template-columns: 1fr 1fr; }
        .d5-cell.span-3, .d5-cell.span-4, .d5-cell.hero-cell { grid-column: span 2; }
        .d2-stats { gap: 1.5rem; }
        .design-switcher { padding: 0.4rem 0.75rem; }
        .design-switcher label { font-size: 0.65rem; }
        .design-switcher button { font-size: 0.65rem; padding: 0.25rem 0.5rem; }
        body { padding-top: 44px; }
        .d1-grid { grid-template-columns: repeat(auto-fill, minmax(260px, 1fr)); }
        .modal { margin-top: 0; }
      }
      @media (max-width: 480px) {
        .d5-grid { grid-template-columns: 1fr; }
        .d5-cell.span-2, .d5-cell.span-3, .d5-cell.span-4, .d5-cell.hero-cell { grid-column: span 1; }
        .d1-grid { grid-template-columns: 1fr; }
        .tool-card-thumb, .tool-card-thumb-placeholder { height: 150px; }
        .modal-thumb { height: 160px; }
        .d3-category-cards { grid-template-columns: 1fr; }
      }
    </style>
  </head>
  <body>
    <!-- Design Switcher -->
    <nav class="design-switcher">
      <label>Pick a design:</label>
      <div class="buttons">
        <button class="active" data-design="d1">1. Tool Directory</button>
        <button data-design="d2">2. Hero + Scroll</button>
        <button data-design="d3">3. Interactive Showcase</button>
        <button data-design="d4">4. Terminal / Dev</button>
        <button data-design="d5">5. Bento Grid</button>
      </div>
      <button class="theme-toggle" onclick="toggleTheme()" title="Toggle dark/light mode" aria-label="Toggle theme">
        <span id="theme-icon">&#9790;</span>
      </button>
    </nav>

    <!-- Design Sections -->
    ${buildDesign1()}
    ${buildDesign2()}
    ${buildDesign3()}
    ${buildDesign4()}
    ${buildDesign5()}

    <!-- Modal -->
    <div class="modal-overlay" id="modal-overlay">
      <div class="modal" id="modal">
        <div id="modal-content"></div>
      </div>
    </div>

    <script>
      // ── Tool Data (embedded at build time) ──
      var TOOLS = ${JSON.stringify(toolsData)};

      // ── Theme ──
      function toggleTheme() {
        var isDark = document.documentElement.getAttribute("data-theme") === "dark";
        document.documentElement.setAttribute("data-theme", isDark ? "light" : "dark");
        document.getElementById("theme-icon").innerHTML = isDark ? "\\u263E" : "\\u2600";
        localStorage.setItem("oft-theme", isDark ? "light" : "dark");
      }
      (function() {
        var s = localStorage.getItem("oft-theme");
        if (s === "dark" || (!s && window.matchMedia("(prefers-color-scheme: dark)").matches)) {
          document.documentElement.setAttribute("data-theme", "dark");
          document.getElementById("theme-icon").innerHTML = "\\u2600";
        }
      })();

      // ── Design Switcher ──
      (function() {
        var btns = document.querySelectorAll(".design-switcher .buttons button");
        var sections = document.querySelectorAll(".design-section");
        var saved = localStorage.getItem("oft-design");

        function activate(id) {
          sections.forEach(function(s) { s.classList.remove("active"); });
          var el = document.getElementById(id);
          if (el) el.classList.add("active");
          btns.forEach(function(b) { b.classList.toggle("active", b.dataset.design === id); });
          localStorage.setItem("oft-design", id);
        }

        btns.forEach(function(b) {
          b.addEventListener("click", function() { activate(b.dataset.design); });
        });

        if (saved && document.getElementById(saved)) activate(saved);
      })();

      // ── Search & Filter (Design 1) ──
      (function() {
        var d1 = document.getElementById("d1");
        if (!d1) return;
        var input = d1.querySelector(".search-input");
        var cards = Array.from(d1.querySelectorAll(".tool-card"));
        var filterBtns = Array.from(d1.querySelectorAll(".filter-btn"));
        var tagBtns = Array.from(d1.querySelectorAll(".tag-filter-btn"));
        var noResults = d1.querySelector(".no-results");
        var countEl = d1.querySelector(".results-count");
        var activeCat = "all";
        var activeTag = "";

        function run() {
          var q = input.value.toLowerCase().trim();
          var vis = 0;
          cards.forEach(function(c) {
            var okCat = activeCat === "all" || c.dataset.category === activeCat;
            var okTag = !activeTag || (c.dataset.tags && c.dataset.tags.split(",").indexOf(activeTag) !== -1);
            var okSearch = !q || c.dataset.search.indexOf(q) !== -1;
            var show = okCat && okTag && okSearch;
            c.style.display = show ? "" : "none";
            if (show) vis++;
          });
          noResults.style.display = vis === 0 ? "block" : "none";
          var hasFilter = q || activeCat !== "all" || activeTag;
          countEl.textContent = hasFilter ? vis + " tool" + (vis !== 1 ? "s" : "") + " found" : "";
        }

        input.addEventListener("input", run);

        filterBtns.forEach(function(b) {
          b.addEventListener("click", function() {
            filterBtns.forEach(function(x) { x.classList.remove("active"); });
            b.classList.add("active");
            activeCat = b.dataset.category;
            run();
          });
        });

        tagBtns.forEach(function(b) {
          b.addEventListener("click", function() {
            if (b.classList.contains("active")) {
              b.classList.remove("active");
              activeTag = "";
            } else {
              tagBtns.forEach(function(x) { x.classList.remove("active"); });
              b.classList.add("active");
              activeTag = b.dataset.tag;
            }
            run();
          });
        });
      })();

      // ── Modal ──
      var overlay = document.getElementById("modal-overlay");
      var modalContent = document.getElementById("modal-content");

      function openModal(toolId) {
        var tool = TOOLS.find(function(t) { return t.id === toolId; });
        if (!tool) return;

        var thumbHtml = tool.hasThumbnail
          ? '<img class="modal-thumb" src="' + tool.thumbnail + '" alt="' + tool.name + '" onerror="this.outerHTML=\\'<div class=modal-thumb-placeholder>' + tool.categoryIcon + '</div>\\'" />'
          : '<div class="modal-thumb-placeholder">' + tool.categoryIcon + '</div>';

        var statusLabel = tool.status === "live" ? "Live" : tool.status === "in-progress" ? "In Progress" : "Idea";
        var linksHtml = '';
        if (tool.status === "live") linksHtml += '<a href="' + tool.live + '" class="btn btn-primary" target="_blank">Open Tool</a>';
        linksHtml += '<a href="' + tool.github + '" class="btn btn-outline" target="_blank">View Source</a>';

        var techHtml = tool.techStack.map(function(t) { return '<span class="tech-badge">' + t + '</span>'; }).join("");
        var tagsHtml = tool.tags.map(function(t) { return '<span class="modal-tag">' + t + '</span>'; }).join("");

        modalContent.innerHTML = thumbHtml
          + '<div class="modal-header"><h2>' + tool.name + '</h2><button class="modal-close" onclick="closeModal()" aria-label="Close">&times;</button></div>'
          + '<div class="modal-meta"><span class="tag tag-category">' + tool.categoryName + '</span><span class="tag tag-' + tool.difficulty.toLowerCase() + '">' + tool.difficulty + '</span><span class="tag tag-' + tool.status + '">' + statusLabel + '</span></div>'
          + '<div class="modal-links">' + linksHtml + '</div>'
          + '<div class="modal-body">' + tool.longDescriptionHtml + '</div>'
          + '<div class="modal-section"><div class="modal-section-title">Tech Stack</div><div class="tech-stack">' + techHtml + '</div></div>'
          + '<div class="modal-section"><div class="modal-section-title">Tags</div><div class="modal-tags">' + tagsHtml + '</div></div>';

        overlay.classList.add("open");
        document.body.style.overflow = "hidden";
      }

      function closeModal() {
        overlay.classList.remove("open");
        document.body.style.overflow = "";
      }

      // Click any tool-card in any design to open modal
      document.addEventListener("click", function(e) {
        var card = e.target.closest(".tool-card");
        if (card && card.dataset.id) {
          e.preventDefault();
          openModal(card.dataset.id);
        }
      });

      overlay.addEventListener("click", function(e) { if (e.target === overlay) closeModal(); });
      document.addEventListener("keydown", function(e) { if (e.key === "Escape") closeModal(); });

      // ── Design 3: JSON Formatter Demo ──
      function formatJSON() {
        var input = document.getElementById("d3-json-input").value;
        var output = document.getElementById("d3-json-output");
        if (!input.trim()) { output.textContent = "Paste some JSON above and click Format."; return; }
        try { output.textContent = JSON.stringify(JSON.parse(input), null, 2); }
        catch (e) { output.textContent = "Error: " + e.message; }
      }
    </script>
  </body>
</html>`;

// ──────────────────────────────────────────────
// Write output
// ──────────────────────────────────────────────

const outPath = path.join(__dirname, "index.html");
fs.writeFileSync(outPath, html, "utf-8");

console.log("Built index.html successfully.");
console.log("  " + totalCount + " tools across " + categories.length + " categories (" + liveCount + " live, " + (totalCount - liveCount) + " ideas)");
console.log("  5 switchable designs with modal, search, filters, and dark/light toggle");
console.log("  Output: " + outPath);
