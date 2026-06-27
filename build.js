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
      <div class="no-results">
        <h3>No tools available for the selected category.</h3>
        <p>The current filters returned no results.</p>
        <button type="button">Clear Filters</button>
      </div>
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
      .pillar-nav { display: flex; gap: 0.25rem; }
      .pillar-link { font-family: var(--font); font-size: 0.8rem; font-weight: 600; padding: 0.35rem 0.75rem; border-radius: 6px; color: #d4d4d8; text-decoration: none; transition: all 0.2s; }
      .pillar-link:hover { background: #27272a; color: #fff; text-decoration: none; }
      .pillar-link.active { background: #3b82f6; color: #fff; }
      .switcher-divider { width: 1px; height: 20px; background: #3f3f46; align-self: center; margin: 0 0.25rem; }
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

      .no-results {
        text-align: center;
        padding: 4rem 2rem;
        color: var(--text-muted);
        display: none;
        flex-direction: column;
        align-items: center;
        justify-content: center;
        gap: 0.75rem;
        background: var(--bg-card);
        border: 1px solid var(--border);
        border-radius: var(--radius);
        max-width: 500px;
        margin: 2rem auto;
      }
      .no-results h3 {
        color: var(--text);
        font-size: 1.2rem;
        font-weight: 700;
      }
      .no-results p {
        color: var(--text-muted);
        font-size: 0.9rem;
        margin-bottom: 0.5rem;
      }
      .no-results button {
        font-family: var(--font);
        font-size: 0.85rem;
        font-weight: 600;
        padding: 0.5rem 1.25rem;
        border: none;
        border-radius: var(--radius-sm);
        background: var(--accent);
        color: #fff;
        cursor: pointer;
        transition: background var(--transition);
      }
      .no-results button:hover {
        background: var(--accent-hover);
      }
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
      <div class="pillar-nav">
        <a href="index.html" class="pillar-link active" title="Developer Tools">Tools</a>
        <a href="portfolio/index.html" class="pillar-link" title="Portfolio Themes">Portfolio</a>
        <a href="resume/index.html" class="pillar-link" title="Resume Themes">Resume</a>
      </div>
      <span class="switcher-divider"></span>
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
          noResults.style.display = vis === 0 ? "flex" : "none";
          var hasFilter = q || activeCat !== "all" || activeTag;
          countEl.textContent = hasFilter ? vis + " tool" + (vis !== 1 ? "s" : "") + " found" : "";
        }

        var showAllBtn = noResults.querySelector("button");
        if (showAllBtn) {
          showAllBtn.addEventListener("click", function() {
            input.value = "";
            activeCat = "all";
            activeTag = "";
            filterBtns.forEach(function(x) {
              x.classList.toggle("active", x.dataset.category === "all");
            });
            tagBtns.forEach(function(x) {
              x.classList.remove("active");
            });
            run();
          });
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
function buildPortfolioMinimal(profile) {
    const p = profile.personal || {};
    const contact = p.contact || {};
    const social = p.social || {};
    const skills = profile.skills || [];
    const projects = profile.projects || [];
    const experience = profile.experience || [];
    const summary = profile.summary || "";
    
    const e = escapeHtml;
    const displayName = p.displayName || [p.firstName, p.lastName].filter(Boolean).join(" ") || "Portfolio";
    const title = p.title || "";
    const bio = p.bio || summary || "";

    // Generate Projects HTML
    const projectsHtml = projects.map(proj => `
      <div class="project-item">
        <h3>${has(proj.liveUrl) ? `<a href="${e(proj.liveUrl)}" target="_blank">${e(proj.name)}</a>` : e(proj.name)}</h3>
        ${has(proj.tagline) ? `<p class="tagline">${e(proj.tagline)}</p>` : ""}
        ${has(proj.description) ? `<p class="desc">${e(proj.description)}</p>` : ""}
        ${has(proj.techStack) ? `<div class="tags">${proj.techStack.map(t => `<span>${e(t)}</span>`).join("")}</div>` : ""}
      </div>
    `).join("");

    // Generate Experience HTML
    const experienceHtml = experience.map(exp => `
      <div class="exp-item">
        <div class="exp-header">
          <h3>${e(exp.role)}</h3>
          <span class="dates">${fmtDate(exp.startDate)} — ${exp.current ? "Present" : fmtDate(exp.endDate)}</span>
        </div>
        <div class="company">${has(exp.url) ? `<a href="${e(exp.url)}" target="_blank">${e(exp.company)}</a>` : e(exp.company)}</div>
        ${has(exp.description) ? `<p class="desc">${e(exp.description)}</p>` : ""}
      </div>
    `).join("");

    // Generate Skills HTML
    const skillsHtml = skills.filter(g => has(g.items)).map(group => `
      <div class="skill-group">
        <h4>${e(group.category)}</h4>
        <p>${group.items.map(i => e(i.name)).join(", ")}</p>
      </div>
    `).join("");

    return `<!DOCTYPE html>
<html lang="en" data-theme="light">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>${e(displayName)} — ${e(title)}</title>
<style>
  :root {
    --bg: #ffffff;
    --text: #1a1a1a;
    --text-muted: #666666;
    --border: #eaeaea;
    --accent: #000000;
  }
  @media (prefers-color-scheme: dark) {
    :root {
      --bg: #111111;
      --text: #eeeeee;
      --text-muted: #999999;
      --border: #333333;
      --accent: #ffffff;
    }
  }
  * { box-sizing: border-box; margin: 0; padding: 0; }
  body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif; line-height: 1.6; color: var(--text); background: var(--bg); max-width: 760px; margin: 0 auto; padding: 4rem 2rem; }
  a { color: var(--accent); text-decoration: none; border-bottom: 1px solid var(--border); transition: border-color 0.2s; }
  a:hover { border-bottom-color: var(--accent); }
  h1 { font-size: 2.5rem; font-weight: 700; margin-bottom: 0.5rem; letter-spacing: -0.02em; }
  h2 { font-size: 1.25rem; font-weight: 600; margin: 3rem 0 1.5rem; padding-bottom: 0.5rem; border-bottom: 1px solid var(--border); }
  h3 { font-size: 1.1rem; font-weight: 600; margin-bottom: 0.25rem; }
  p { margin-bottom: 1rem; color: var(--text-muted); }
  
  .hero { margin-bottom: 4rem; }
  .hero .title { font-size: 1.25rem; color: var(--text-muted); margin-bottom: 1.5rem; }
  .hero .bio { font-size: 1.1rem; max-width: 600px; color: var(--text); }
  .social-links { display: flex; gap: 1rem; margin-top: 1.5rem; flex-wrap: wrap; }
  .social-links a { font-weight: 500; font-size: 0.95rem; }

  .project-item, .exp-item { margin-bottom: 2rem; }
  .project-item .tagline { font-size: 0.95rem; color: var(--text); margin-bottom: 0.5rem; }
  .tags { display: flex; gap: 0.5rem; flex-wrap: wrap; margin-top: 0.75rem; }
  .tags span { font-size: 0.75rem; padding: 0.2rem 0.6rem; border: 1px solid var(--border); border-radius: 4px; color: var(--text-muted); }

  .exp-header { display: flex; justify-content: space-between; align-items: baseline; flex-wrap: wrap; }
  .exp-header .dates { font-size: 0.85rem; color: var(--text-muted); }
  .company { font-weight: 500; margin-bottom: 0.5rem; }

  .skill-group { margin-bottom: 1.25rem; }
  .skill-group h4 { font-size: 0.95rem; font-weight: 600; margin-bottom: 0.25rem; color: var(--text); }
  .skill-group p { font-size: 0.95rem; }

  footer { margin-top: 5rem; padding-top: 2rem; border-top: 1px solid var(--border); font-size: 0.85rem; color: var(--text-muted); display: flex; justify-content: space-between; }
</style>
</head>
<body>
  <header class="hero">
    <h1>${e(displayName)}</h1>
    <div class="title">${e(title)}</div>
    ${has(bio) ? `<p class="bio">${e(bio)}</p>` : ""}
    <div class="social-links">
      ${has(contact.email) ? `<a href="mailto:${e(contact.email)}">Email</a>` : ""}
      ${has(social.github) ? `<a href="${e(social.github)}" target="_blank">GitHub</a>` : ""}
      ${has(social.linkedin) ? `<a href="${e(social.linkedin)}" target="_blank">LinkedIn</a>` : ""}
      ${has(contact.website) ? `<a href="${e(contact.website)}" target="_blank">Website</a>` : ""}
    </div>
  </header>

  ${has(projects) ? `
  <section id="projects">
    <h2>Selected Work</h2>
    <div class="projects-list">${projectsHtml}</div>
  </section>` : ""}

  ${has(experience) ? `
  <section id="experience">
    <h2>Experience</h2>
    <div class="experience-list">${experienceHtml}</div>
  </section>` : ""}

  ${has(skills) ? `
  <section id="skills">
    <h2>Capabilities</h2>
    <div class="skills-list">${skillsHtml}</div>
  </section>` : ""}

  <footer>
    <span>&copy; ${new Date().getFullYear()} ${e(displayName)}</span>
    <span>Built with <a href="https://github.com/praveenscience/One-File-Tools" target="_blank">One File Tools</a></span>
  </footer>
</body>
</html>`;
  }

  function buildPortfolioDesigner(profile) {
    const p = profile.personal || {};
    const contact = p.contact || {};
    const social = p.social || {};
    const skills = profile.skills || [];
    const projects = profile.projects || [];
    const experience = profile.experience || [];
    const summary = profile.summary || "";
    
    const e = escapeHtml;
    const displayName = p.displayName || [p.firstName, p.lastName].filter(Boolean).join(" ") || "Portfolio";
    const title = p.title || "";
    const bio = p.bio || summary || "";

    // Generate Projects HTML (Image-Heavy)
    const projectsHtml = projects.map(proj => `
      <article class="project-card">
        <div class="project-image">
          ${has(proj.thumbnail) 
            ? `<img src="${e(proj.thumbnail)}" alt="${e(proj.name)}" loading="lazy" onerror="this.src='data:image/svg+xml;utf8,<svg xmlns=\\'http://www.w3.org/2000/svg\\' width=\\'100%\\' height=\\'100%\\'><rect width=\\'100%\\' height=\\'100%\\' fill=\\'%23e5e7eb\\'/><text x=\\'50%\\' y=\\'50%\\' font-family=\\'sans-serif\\' font-size=\\'24\\' fill=\\'%239ca3af\\' text-anchor=\\'middle\\' dy=\\'.3em\\'>Image Placeholder</text></svg>'">` 
            : `<div class="image-placeholder">No Image Available</div>`
          }
        </div>
        <div class="project-info">
          <h3>${has(proj.liveUrl) ? `<a href="${e(proj.liveUrl)}" target="_blank">${e(proj.name)}</a>` : e(proj.name)}</h3>
          ${has(proj.tagline) ? `<span class="tagline">${e(proj.tagline)}</span>` : ""}
          ${has(proj.description) ? `<p>${e(proj.description)}</p>` : ""}
        </div>
      </article>
    `).join("");

    // Generate Experience HTML (Clean, spaced out)
    const experienceHtml = experience.map(exp => `
      <div class="exp-row">
        <div class="exp-meta">
          <span class="dates">${fmtDate(exp.startDate)} — ${exp.current ? "Present" : fmtDate(exp.endDate)}</span>
          <span class="company">${has(exp.url) ? `<a href="${e(exp.url)}" target="_blank">${e(exp.company)}</a>` : e(exp.company)}</span>
        </div>
        <div class="exp-details">
          <h4>${e(exp.role)}</h4>
          ${has(exp.description) ? `<p>${e(exp.description)}</p>` : ""}
        </div>
      </div>
    `).join("");

    return `<!DOCTYPE html>
<html lang="en" data-theme="light">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>${e(displayName)} — ${e(title)}</title>
<style>
  :root {
    --bg: #f9f9f9;
    --surface: #ffffff;
    --text-main: #111111;
    --text-muted: #777777;
    --border: #e2e2e2;
    --font-sans: -apple-system, BlinkMacSystemFont, "Helvetica Neue", sans-serif;
    --font-serif: "Playfair Display", "Georgia", serif;
  }
  @media (prefers-color-scheme: dark) {
    :root {
      --bg: #0f0f0f;
      --surface: #1a1a1a;
      --text-main: #f4f4f4;
      --text-muted: #a0a0a0;
      --border: #333333;
    }
  }
  * { box-sizing: border-box; margin: 0; padding: 0; }
  body { font-family: var(--font-sans); color: var(--text-main); background: var(--bg); line-height: 1.6; }
  a { color: inherit; text-decoration: none; position: relative; }
  a::after { content: ''; position: absolute; width: 100%; transform: scaleX(0); height: 1px; bottom: 0; left: 0; background-color: currentColor; transform-origin: bottom right; transition: transform 0.4s cubic-bezier(0.86, 0, 0.07, 1); }
  a:hover::after { transform: scaleX(1); transform-origin: bottom left; }
  
  .container { max-width: 1400px; margin: 0 auto; padding: 0 4vw; }
  
  /* Hero Section */
  header { min-height: 90vh; display: flex; flex-direction: column; justify-content: center; padding: 10vh 0; }
  .greeting { font-size: 1rem; text-transform: uppercase; letter-spacing: 0.2em; color: var(--text-muted); margin-bottom: 2rem; display: block; }
  h1 { font-family: var(--font-serif); font-size: clamp(3rem, 8vw, 7rem); font-weight: 400; line-height: 1.1; margin-bottom: 1.5rem; letter-spacing: -0.02em; }
  .hero-bio { font-size: clamp(1.2rem, 2vw, 1.8rem); color: var(--text-muted); max-width: 800px; font-weight: 300; }
  
  /* Sections */
  section { padding: 8rem 0; border-top: 1px solid var(--border); }
  .section-header { font-size: 0.9rem; text-transform: uppercase; letter-spacing: 0.15em; color: var(--text-muted); margin-bottom: 4rem; }
  
  /* Projects Grid */
  .projects-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(400px, 1fr)); gap: 4rem; }
  .project-card { display: flex; flex-direction: column; gap: 1.5rem; }
  .project-image { width: 100%; aspect-ratio: 4/3; overflow: hidden; background: var(--surface); border-radius: 4px; }
  .project-image img { width: 100%; height: 100%; object-fit: cover; transition: transform 0.6s ease; }
  .project-card:hover .project-image img { transform: scale(1.05); }
  .image-placeholder { width: 100%; height: 100%; display: flex; align-items: center; justify-content: center; color: var(--text-muted); background: var(--border); }
  .project-info h3 { font-family: var(--font-serif); font-size: 2rem; font-weight: 400; margin-bottom: 0.5rem; }
  .tagline { display: block; font-size: 0.9rem; text-transform: uppercase; letter-spacing: 0.1em; color: var(--text-muted); margin-bottom: 1rem; }
  
  /* Experience Row */
  .exp-row { display: grid; grid-template-columns: 1fr 2fr; gap: 2rem; margin-bottom: 4rem; }
  .exp-meta { display: flex; flex-direction: column; gap: 0.5rem; color: var(--text-muted); }
  .exp-details h4 { font-family: var(--font-serif); font-size: 1.8rem; font-weight: 400; margin-bottom: 1rem; }
  
  /* Footer */
  footer { padding: 4rem 0; text-align: center; border-top: 1px solid var(--border); }
  .socials { display: flex; justify-content: center; gap: 2rem; margin-bottom: 2rem; font-size: 1.2rem; }
  
  @media (max-width: 768px) {
    .exp-row { grid-template-columns: 1fr; gap: 1rem; margin-bottom: 3rem; }
    .projects-grid { grid-template-columns: 1fr; }
  }
</style>
</head>
<body>
  <div class="container">
    <header>
      <span class="greeting">${e(title)}</span>
      <h1>${e(displayName)}.</h1>
      ${has(bio) ? `<p class="hero-bio">${e(bio)}</p>` : ""}
    </header>

    ${has(projects) ? `
    <section id="work">
      <h2 class="section-header">Selected Works</h2>
      <div class="projects-grid">${projectsHtml}</div>
    </section>` : ""}

    ${has(experience) ? `
    <section id="experience">
      <h2 class="section-header">Experience</h2>
      <div class="experience-list">${experienceHtml}</div>
    </section>` : ""}

    <footer>
      <div class="socials">
        ${has(contact.email) ? `<a href="mailto:${e(contact.email)}">Email</a>` : ""}
        ${has(social.github) ? `<a href="${e(social.github)}" target="_blank">GitHub</a>` : ""}
        ${has(social.linkedin) ? `<a href="${e(social.linkedin)}" target="_blank">LinkedIn</a>` : ""}
      </div>
      <p style="color: var(--text-muted); font-size: 0.9rem;">&copy; ${new Date().getFullYear()} ${e(displayName)}. Built with One File Tools.</p>
    </footer>
  </div>
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

        <div class="theme-card">
          <div class="theme-thumb">&#10024;</div>
          <div class="theme-info">
            <h3>Minimal</h3>
            <p>Ultra-clean single-page layout. Fast-loading, typography-driven, and content-focused with zero distracting animations.</p>
            <div class="theme-links">
              <a href="themes/minimal.html" class="btn-primary">Preview</a>
            </div>
          </div>
        </div>

        <div class="theme-card">
          <div class="theme-thumb">&#127912;</div>
          <div class="theme-info">
            <h3>Designer</h3>
            <p>Visual-first, image-heavy approach. Features large project thumbnails, abundant whitespace, and elegant typography.</p>
            <div class="theme-links">
              <a href="themes/designer.html" class="btn-primary">Preview</a>
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

  // Build and write the Minimal portfolio theme
  fs.writeFileSync(path.join(portfolioDir, "minimal.html"), buildPortfolioMinimal(profile), "utf-8");
  console.log("Built portfolio/themes/minimal.html");

  // Build and write the Designer portfolio theme
  fs.writeFileSync(path.join(portfolioDir, "designer.html"), buildPortfolioDesigner(profile), "utf-8");
  console.log("Built portfolio/themes/designer.html");

  // Showcase pages
  fs.writeFileSync(path.join(__dirname, "resume", "index.html"), buildResumeShowcase(), "utf-8");
  fs.writeFileSync(path.join(__dirname, "portfolio", "index.html"), buildPortfolioShowcase(), "utf-8");
  console.log("Built resume/index.html");
  console.log("Built portfolio/index.html");

} else {
  console.log("\nSkipping resume/portfolio generation (no profile.json found).");
}
