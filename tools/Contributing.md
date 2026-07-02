# Contributing a Tool

Thank you for contributing a tool to One File Tools! This guide will walk you through the entire process, step by step.

---

## What you're building

A **single, self-contained HTML file** that does something useful for developers. Everything — HTML, CSS, and JavaScript — lives in one file. No build step, no `npm install`, no JS frameworks. CDN links for lightweight libraries and fonts are encouraged to keep files slim. Just open it in a browser and it works.

### Example

```
tools/json-formatter.html    <- your tool (one file, everything inside)
tools/json-formatter.png     <- screenshot of your tool
```

---

## Before you start

1. Check the [Ideas Board](../ReadMe.md#ideas-board) in the ReadMe for unclaimed ideas
2. Check [existing tools](#existing-categories) below so you don't duplicate one
3. Open an [issue](https://github.com/praveenscience/One-File-Tools/issues) or comment on an existing one to claim it
4. **Wait for assignment** before starting — don't waste effort on something someone else is building
5. Look at any existing `.html` file in this folder to see the patterns used

---

## Step-by-step guide

### 1. Fork, clone, and install

```bash
git clone https://github.com/YOUR-USERNAME/One-File-Tools.git
cd One-File-Tools
npm install
```

### 2. Create a branch

Pick a clear, descriptive branch name:

```bash
# For a new tool
git checkout -b add/json-formatter

# For enhancing an existing tool
git checkout -b feat/json-formatter-dark-mode

# For fixing a bug
git checkout -b fix/json-formatter-paste-bug
```

### 3. Create your file

Use **kebab-case** for the filename. It should clearly describe what the tool does:

```bash
touch tools/json-formatter.html
```

Good names: `json-formatter.html`, `color-picker.html`, `uuid-generator.html`, `contrast-checker.html`

Bad names: `JSONFormatter.html`, `tool1.html`, `my-awesome-tool.html`

### 4. Build your tool

Use this starter template:

```html
<!DOCTYPE html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>Tool Name — One File Tools</title>
    <style>
      /* ========================================
         Reset & Base
         ======================================== */
      *,
      *::before,
      *::after {
        box-sizing: border-box;
        margin: 0;
        padding: 0;
      }

      body {
        font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto,
          Oxygen, Ubuntu, Cantarell, sans-serif;
        line-height: 1.6;
        padding: 2rem;
        max-width: 960px;
        margin: 0 auto;
        background: #fafafa;
        color: #1a1a1a;
      }

      /* ========================================
         Dark Mode
         ======================================== */
      @media (prefers-color-scheme: dark) {
        body {
          background: #0a0a0a;
          color: #e5e5e5;
        }
      }

      /* ========================================
         Your styles here
         ======================================== */
    </style>
  </head>
  <body>
    <header>
      <h1>Tool Name</h1>
      <p>A brief description of what this tool does.</p>
    </header>

    <main>
      <!-- Your tool UI here -->
    </main>

    <footer>
      <p>
        Part of
        <a href="https://github.com/praveenscience/One-File-Tools"
          >One File Tools</a
        >
      </p>
    </footer>

    <script>
      // Your JavaScript here
    </script>
  </body>
</html>
```

### 5. Register your tool in data/tools.json

Open `data/tools.json` in the project root and add an entry to the `"tools"` array:

```json
{
  "id": "json-formatter",
  "name": "JSON Formatter",
  "shortDescription": "Format, validate, and minify JSON locally in your browser.",
  "longDescription": "## JSON Formatter\n\nPaste or type JSON and instantly format, validate, or minify it.\n\n### Features\n\n- Pretty print with configurable indentation\n- Minify JSON to one line\n- Syntax validation with error highlighting\n- Copy to clipboard",
  "category": "json-api",
  "tags": ["json", "formatter", "validator", "minify"],
  "techStack": ["HTML5", "CSS3", "Vanilla JS"],
  "difficulty": "Easy",
  "status": "live"
}
```

#### Field reference

| Field | Required | Description |
|-------|----------|-------------|
| `id` | Yes | Kebab-case identifier — must match your filename (without `.html`) |
| `name` | Yes | Display name shown on the landing page card |
| `shortDescription` | Yes | One-line summary (shown on the card) |
| `longDescription` | Yes | Markdown-formatted description with a `### Features` section (shown in the modal) |
| `category` | Yes | One of the valid category IDs (see below) |
| `tags` | Yes | Array of lowercase keywords for search/filtering |
| `techStack` | Yes | Array of technologies used (e.g., `["HTML5", "CSS3", "Vanilla JS"]`) |
| `difficulty` | Yes | `"Easy"` or `"Medium"` |
| `status` | Yes | `"live"` for working tools |

#### Valid category IDs

| ID | Display name |
|----|-------------|
| `accessibility` | Accessibility |
| `browser-network` | Browser & Network |
| `color` | Color Tools |
| `css` | CSS Tools |
| `utilities` | Developer Utilities |
| `image` | Image Tools |
| `json-api` | JSON & API |
| `text` | Text & Content |
| `web-seo` | Web & SEO |

### 6. Add a screenshot

Take a screenshot of your tool in action and save it as `tools/your-tool-name.png` (same name as the HTML file).

Recommended size: **1280x720** (16:9 aspect ratio) for crisp display without cropping.

Tips for a good screenshot:
- Show the tool with some sample data filled in (not empty)
- Use the default/light mode
- Capture the full tool UI, not just a part of it
- Make sure text is readable

### 7. Sort and normalize data/tools.json

```bash
node scripts/sort-norm.js data/tools.json
```

This alphabetically sorts tools, normalizes tags (e.g., `js` becomes `javascript`, `html5` becomes `html`), and sorts tech stacks. Run this every time you edit `data/tools.json`.

### 8. Build and verify

```bash
node scripts/build.js
open index.html
```

Check that your tool card appears on the landing page with the correct name, description, category, and screenshot.

> **Note:** You do **not** need to edit `scripts/index-template.txt`, `index.html`, or the ReadMe table. These are auto-generated by the build scripts. The maintainer runs `node scripts/sync-readme.js` after merging.

### 9. Test thoroughly

- [ ] Open the file directly in your browser (`open tools/your-tool-name.html`)
- [ ] Test on **Chrome** and **Firefox** at minimum
- [ ] Test on **mobile** (resize your browser or use DevTools responsive mode)
- [ ] Check for **console errors** (open DevTools → Console)
- [ ] Verify core functionality works (CDN resources require a network connection, which is fine)
- [ ] Test with **edge cases** (empty input, very long input, special characters)
- [ ] Try **keyboard navigation** (Tab through all interactive elements)

### 10. Format with Prettier

```bash
npm run format                                     # format ALL tools
npx prettier --write tools/your-tool-name.html     # format a single tool
```

The project uses Prettier (included as a devDependency) with a `.prettierrc` config at the root. Key settings:
- 2-space indentation, no tabs
- Double quotes, semicolons always
- No trailing commas
- `printWidth: 80000` (intentionally high — never auto-wraps lines)

### 11. Commit and push

```bash
git add tools/your-tool-name.html tools/your-tool-name.png data/tools.json
git commit -m "Add: your-tool-name"
git push origin add/your-tool-name
```

Then open a Pull Request on GitHub.

---

## Tool requirements

### Must have

- [ ] **Single `.html` file** — all HTML, CSS, and JS in one file
- [ ] **Works by opening in a browser** — no server, no build step
- [ ] **No `npm install`** — no package manager dependencies
- [ ] **CDN links encouraged** — use CDN for libraries and fonts instead of inlining source code
- [ ] **Responsive design** — works on desktop and mobile
- [ ] **No console errors**
- [ ] **No tracking scripts** — no analytics, ads, or monetization
- [ ] **Clear title and description** in the page
- [ ] **Footer link** back to the One File Tools repo
- [ ] **Prettier formatted** using the project's `.prettierrc` config

### Should have

- [ ] **Dark mode** — at minimum via `@media (prefers-color-scheme: dark)`
- [ ] **Keyboard accessible** — all interactive elements reachable via Tab
- [ ] **Semantic HTML** — `<header>`, `<main>`, `<footer>`, `<label>`, `<button>`, etc.
### May have

- [ ] **CDN links** for lightweight CSS/JS libraries (e.g., Tailwind CSS, Highlight.js) — **preferred** over inlining library source code to keep files slim
- [ ] **Google Fonts** — acceptable, but the system font stack from the template works fine with zero external requests
- [ ] **External API calls** — only if the tool's core purpose requires it (e.g., DNS lookup). The tool should degrade gracefully without the API

### Must not have

- [ ] **No JS frameworks** — no React, Vue, Angular, Svelte, etc.
- [ ] **No heavy UI libraries** — no Bootstrap JS, jQuery, etc.
- [ ] **No `npm install`** — no package manager dependency
- [ ] **No inlined library source** — use CDN links instead of copy-pasting minified library code
- [ ] **No tracking or analytics** of any kind
- [ ] **No ads or monetization**
- [ ] **No server-side requirements**

---

## Code style guide

### HTML

- Use semantic elements (`<header>`, `<main>`, `<section>`, `<label>`, `<button>`)
- Include `lang="en"` on `<html>`
- Include the viewport meta tag
- Use descriptive `id` and `class` names
- Associate every `<input>` with a `<label>`

### CSS

- Group styles with clear section comments
- Use CSS custom properties (variables) for theming and colors
- Mobile-first or responsive approach
- Prefer modern CSS (flexbox, grid) over floats or hacks
- Support dark mode — at minimum via `@media (prefers-color-scheme: dark)`

### JavaScript

- Use modern JS (ES6+) — `const`, `let`, arrow functions, template literals
- Use `addEventListener` — no inline `onclick` attributes
- Keep functions small and focused
- Add brief comments for non-obvious logic
- Handle edge cases (empty input, invalid data)
- Use `navigator.clipboard.writeText()` for copy-to-clipboard functionality

---

## Enhancing an existing tool

Enhancements are valuable contributions! Some ideas:

- Adding **dark mode** support
- Improving **responsive design** for mobile
- Adding **keyboard shortcuts**
- Improving **accessibility** (ARIA labels, focus management, screen reader support)
- Adding **copy to clipboard** functionality
- Better **error handling** and user feedback
- Performance improvements
- Adding **export** options (download, share)

Branch naming for enhancements:

```bash
git checkout -b feat/tool-name-what-you-changed
# Example: feat/json-formatter-dark-mode
```

---

## Existing categories

| Category | Example tools |
|----------|--------------|
| **CSS Tools** | Box Shadow Generator, Grid Generator, Flexbox Playground, Clip Path Generator |
| **Color Tools** | CSS Color Converter, Palette Generator |
| **Web & SEO** | OG Generator, Meta Tag Generator, Robots.txt Generator, Sitemap Generator |
| **JSON & API** | JSON Formatter, JSON Diff Viewer, JWT Decoder |
| **Developer Utilities** | Password Generator, UUID Generator, Cron Builder, Favicon Generator |
| **Image Tools** | Aspect Ratio Calculator, Color Palette Extractor |
| **Text & Content** | Lorem Ipsum Generator |
| **Browser & Network** | *(open for contributions)* |
| **Accessibility** | *(open for contributions)* |

---

## PR format

### Title

```
Add: tool-name            — for new tools
Improve: tool-name - what — for enhancements
Fix: tool-name - what     — for bug fixes
```

### Description

When you open a PR, a template will be pre-filled. Fill in:

1. **What** — What does this tool do / what did you change? Link the related issue with `Closes #123`
2. **Type of Change** — New tool, enhancement, bug fix, or docs
3. **Screenshot** — Required for new tools and UI changes
4. **Checklist** — Confirm you've met the requirements

---

## SSoC contributors

If you're participating in **Social Summer of Code**:

1. Filter [Issues](https://github.com/praveenscience/One-File-Tools/issues) by `Easy` or `Medium` labels
2. Comment: *"I'd like to work on this as a part of SSoC"*
3. **Wait for assignment** — do not start before being assigned
4. Include `SSoC` in your PR description
5. Include `Fixes: #Issue` in your PR
6. **One issue at a time** — complete your current task before picking another
7. **Original work only** — AI-generated tools without understanding will be rejected

---

## Checklist before submitting

- [ ] Tool is a single `.html` file in `tools/`
- [ ] Filename is kebab-case and matches the `id` in `data/tools.json`
- [ ] Screenshot saved as `tools/[id].png` (1280x720 recommended)
- [ ] Entry added to `data/tools.json` with all required fields
- [ ] Ran `node scripts/sort-norm.js data/tools.json`
- [ ] Ran `node scripts/build.js` and verified tool appears on landing page
- [ ] Works in Chrome and Firefox
- [ ] Works on mobile (responsive)
- [ ] No console errors
- [ ] Core functionality works (CDN resources need network, which is fine)
- [ ] Formatted with Prettier (`npm run format` or `npx prettier --write tools/your-tool.html`)
- [ ] Has dark mode support
- [ ] Footer links back to One File Tools
- [ ] Keyboard accessible (Tab navigation works)
