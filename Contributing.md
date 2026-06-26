# Contributing to One File Tools

Thank you for your interest in contributing! Whether you’re here through **SSoC (Social Summer of Code)**, Hacktoberfest, or just because you love building useful things, you’re welcome here.

This guide will walk you through everything you need to know.

---

## Table of Contents

- [Philosophy](#philosophy)
- [Types of Contributions](#types-of-contributions)
- [Before You Start](#before-you-start)
- [Building a New Tool](#building-a-new-tool)
- [Enhancing an Existing Tool](#enhancing-an-existing-tool)
- [Tool Requirements](#tool-requirements)
- [File Naming Convention](#file-naming-convention)
- [Code Style](#code-style)
- [Pull Request Process](#pull-request-process)
- [Review & Labels](#review--labels)
- [SSoC Contributors](#ssoc-contributors)
- [Need Help?](#need-help)

---

## Philosophy

Every tool in this repository follows one core principle:

> **One tool. One file. Open and use.**

This means:

- Each tool lives in a **single `.html` file**.
- It must work by simply **opening the file in a browser**.
- **No build step**, no `npm install`, no framework.
- Code should be **readable**, someone learning web development should be able to understand it.
- It should work **offline** whenever possible.

---

## Types of Contributions

Every pull request should fall into one of these categories:

| Type              | Description                                                                     | Label             |
| ----------------- | ------------------------------------------------------------------------------- | ----------------- |
| **New Tool**      | Build a tool from the [Ideas Board](ReadMe.md#ideas-board) or propose your own. | `Easy` / `Medium` |
| **Enhancement**   | Improve an existing tool - UI, UX, features, accessibility, performance.        | `Easy` / `Medium` |
| **Bug Fix**       | Fix something that’s broken.                                                    | `Easy` / `Medium` |
| **Documentation** | Improve docs, add code comments, fix typos.                                     | `Easy`            |

---

## Before You Start

1. **Check existing issues:** Someone may already be working on the same tool.
2. **Check existing PRs:** Avoid duplicate effort
3. **Claim your issue:** Comment on the issue saying you’d like to work on it. Wait for assignment before starting
4. **One tool per PR:** Keep your pull requests focused. Don’t bundle multiple tools into one PR

### Proposing a new idea

If your tool idea isn’t on the Ideas Board:

1. Open a [New Tool Idea](https://github.com/praveenscience/One-File-Tools/issues/new?template=new-tool-idea.yml) issue using the issue template.
2. Fill in the tool name, filename, category, description, features, and suggested difficulty.
3. The maintainer will review it, assign a difficulty label, and add it to the board.

For bug reports or enhancements to existing tools, use the appropriate [issue template](https://github.com/praveenscience/One-File-Tools/issues/new/choose).

---

## Building a New Tool

### Step 1 — Fork & clone

```bash
git clone https://github.com/YOUR-USERNAME/One-File-Tools.git
cd One-File-Tools
```

### Step 2 — Create a branch

#### Creating a New Tool

```bash
git checkout -b add/your-tool-name
git checkout -b new/json-formatter
```

Use the `add/` / `new/` prefix for new tools.

#### Enhancing an Existing Tool

```bash
git checkout -b feat/json-formatter
```

Use the `feat/` for enhancements.

#### Fixing Bug in an Existing Tool

```bash
git checkout -b fix/json-formatter
```

Use the `fix/` for bug fixes.

### Step 3 — Create or Edit your file

```bash
touch tools/your-tool-name.html
vim tools/your-tool-name.html
```

### Step 4 — Build your tool

Use the template below as a starting point:

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
        font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Oxygen, Ubuntu, Cantarell, sans-serif;
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
      <p>Part of <a href="https://github.com/praveenscience/One-File-Tools">One File Tools</a></p>
    </footer>

    <script>
      // Your JavaScript here
    </script>
  </body>
</html>
```

### Step 5 — Register your tool

Add an entry for your tool in `tools.json` (inside the `"tools"` array). Follow the existing entries as a guide — you'll need these fields:

```json
{
  "id": "your-tool-name",
  "name": "Your Tool Name",
  "shortDescription": "A one-line summary of what the tool does.",
  "longDescription": "## Your Tool Name\n\nA longer description with a ### Features section.",
  "category": "css",
  "tags": ["relevant", "tags"],
  "techStack": ["CSS3", "HTML5", "Vanilla JS"],
  "difficulty": "Easy",
  "status": "live"
}
```

Valid category IDs: `accessibility`, `browser-network`, `color`, `css`, `utilities`, `image`, `json-api`, `text`, `web-seo`.

### Step 6 — Add a screenshot

Take a screenshot of your tool and save it as `tools/your-tool-name.png` (same name as the HTML file, kebab-case).

### Step 7 — Sort and normalize `tools.json`

Run the sort-norm script to alphabetically sort tools, normalize tags, and sort tech stacks in `tools.json`:

```bash
node sort-norm.js tools.json
```

This ensures consistent ordering and deduplicates tag aliases (e.g., `js` → `javascript`, `html5` → `html`).

### Step 8 — Build and verify

Run the build script to regenerate the landing page, then open `index.html` to verify your tool appears:

```bash
node build.js
open index.html
```

> **Note:** You do **not** need to edit the Available Tools table in `ReadMe.md` — it is auto-generated by `node sync-readme.js`, which the maintainer runs after merging your PR.

### Step 9 — Test

- Open the file directly in your browser (`open tools/your-tool-name.html`).
- Test on Chrome and Firefox at minimum.
- Test on mobile (resize your browser or use DevTools responsive mode).
- Check for console errors.
- Verify it works offline (disconnect and reload).

### Step 10 — Submit

```bash
git add tools/your-tool-name.html tools/your-tool-name.png tools.json
git commit -m "Add: your-tool-name"
git push origin add/your-tool-name
```

Then open a Pull Request following the [PR process below](#pull-request-process).

---

## Enhancing an Existing Tool

Enhancements are valuable contributions! Some examples:

- Adding **dark mode** support.
- Improving **responsive design** for mobile.
- Adding **keyboard shortcuts**.
- Improving **accessibility** (ARIA labels, focus management, screen reader support).
- Adding **copy to clipboard** functionality.
- Better **error handling** and user feedback.
- Performance improvements.
- Adding **export** options (download, share).

### Branch naming for enhancements

```bash
git checkout -b feat/tool-name-what-you-changed
# Example: feat/json-formatter-dark-mode
```

---

## Tool Requirements

### Must have

- [ ] Single `.html` file, all HTML, CSS, and JS in one file.
- [ ] Works by opening the file in a browser, no server required.
- [ ] No build step.
- [ ] Responsive design, works on desktop and mobile.
- [ ] No console errors.
- [ ] No tracking scripts, analytics, or advertisements.
- [ ] Has a clear title and description in the page.
- [ ] Includes a link back to the repo in the footer.
- [ ] Prettier formatted in the given configuration.

### Should have

- [ ] Dark mode support (at minimum via `prefers-color-scheme`).
- [ ] Keyboard accessible, all interactive elements reachable via Tab.
- [ ] Semantic HTML (`<header>`, `<main>`, `<footer>`, `<label>`, etc.).
- [ ] Works offline.

### May have

- [ ] A CDN link for styling (e.g., Tailwind CSS via CDN), this is acceptable but up to you.
- [ ] Google Fonts for typography — acceptable, but use the system font stack from the template if you want zero external requests.
- [ ] External API calls, only if the tool’s core purpose requires it (e.g., DNS lookup). The tool should degrade gracefully without the API.

### Must not have

- [ ] External JavaScript frameworks / heavy UI libraries (React, Vue, Angular, etc.).
- [ ] `npm install` or any package manager dependency.
- [ ] Tracking or analytics of any kind.
- [ ] Ads or monetization.
- [ ] Server Side Requirements.

---

## File Naming Convention

Use **kebab-case**. The filename should clearly describe the tool.

```
Good:
  json-formatter.html
  color-picker.html
  og-generator.html
  contrast-checker.html
  uuid-generator.html

Bad:
  JSONFormatter.html
  jsonFormatter.html
  tool1.html
  my-awesome-tool.html
```

---

## Code Style

Keep it simple and readable. Someone learning web development should be able to read your code and learn from it.

### HTML

- Use semantic elements (`<header>`, `<main>`, `<section>`, `<label>`, `<button>`).
- Include `lang="en"` on `<html>`.
- Include viewport meta tag.
- Use descriptive `id` and `class` names.

### CSS

- Group styles with clear section comments.
- Use CSS custom properties (variables) for theming.
- Mobile-first or responsive approach.
- Prefer modern CSS (flexbox, grid) over floats or hacks.

### JavaScript

- Use modern JS (ES6+) - `const`, `let`, arrow functions, template literals.
- Use `addEventListener` - no inline `onclick`.
- Keep functions small and focused.
- Add brief comments for non-obvious logic.

### Prettier Format

This project uses [Prettier](https://prettier.io/) for consistent code formatting. If you use VS Code, install the Prettier extension and it will pick up the config automatically.

**Key settings:**

- **Print Width:** No forced wrapping (long lines are fine)
- **Tab Width:** 2 spaces
- **Tabs:** Spaces, not tabs
- **Semicolons:** Always
- **Quotes:** Double quotes
- **Trailing Commas:** None
- **Arrow Parens:** Always (`(x) => x`, not `x => x`)
- **Bracket Spacing:** `{ foo }` not `{foo}`
- **Bracket Same Line:** No (`>` of multi-attribute HTML tags goes on a new line)
- **End of Line:** LF
- **Single Attribute Per Line:** No
- **Quote Props:** As needed (only quote object keys when required)
- **Prose Wrap:** Preserve (don’t rewrap Markdown or text)
- **Embedded Language Formatting:** Auto (JS and CSS inside HTML get formatted too)
- **Object Wrap:** Preserve (keeps your object layout as written)

A `.prettierrc` file already exists at the project root. If you need to recreate it, here are the settings:

```json
{
  "printWidth": 80000,
  "tabWidth": 2,
  "useTabs": false,
  "semi": true,
  "singleQuote": false,
  "trailingComma": "none",
  "bracketSpacing": true,
  "arrowParens": "always",
  "endOfLine": "lf",
  "singleAttributePerLine": false,
  "bracketSameLine": false,
  "quoteProps": "as-needed",
  "proseWrap": "preserve",
  "embeddedLanguageFormatting": "auto",
  "objectWrap": "preserve",
  "htmlWhitespaceSensitivity": "css"
}
```

Run Prettier before submitting:

```bash
npx prettier --write tools/your-tool-name.html
```

> **Note:** The `printWidth: 80000` is intentional — it effectively means “never auto-wrap lines”. This is by design, not a typo.

## Pull Request Process

### PR title format

```
Add: tool-name            — for new tools
Improve: tool-name - what — for enhancements
Fix: tool-name - what     — for bug fixes
Docs: what changed        — for documentation
```

### PR description

When you open a PR, a **template** will be pre-filled with the required sections. Fill in:

1. **What** — What does this tool do / what did you change? Link the related issue with `Closes #123`.
2. **Type of Change** — Check whether it’s a new tool, enhancement, bug fix, or docs update.
3. **Screenshot** — Required for new tools and UI changes.
4. **Checklist** — Go through the checklist and confirm you’ve met the requirements.

### What happens after you submit

1. The maintainer (@praveenscience) will review your PR.
2. You may receive feedback or change requests, this is normal and part of the learning process.
3. Once approved, your PR will be merged.
4. Your tool goes live on the hosted site.

---

## Review & Labels

### Difficulty labels

| Label    | Meaning                                                                  |
| -------- | ------------------------------------------------------------------------ |
| `Easy`   | Straightforward tool with a single clear purpose and minimal logic       |
| `Medium` | Tool with multiple features, interactive elements, or more complex logic |

There are **no `Hard` labels** in this project. The single-file constraint naturally keeps scope manageable.

### Who assigns labels?

Difficulty labels are assigned by the maintainer ([@praveenscience](https://github.com/praveenscience)). If you feel a label is too high or too low, you’re welcome to discuss it in the issue / PR, labels are **slightly negotiable**.

### Review expectations

- PRs are reviewed in the order they’re received.
- Simple, clean PRs get merged faster within 48 hours or less.
- If changes are requested, respond within **2 days** or the PR may be closed.
- Be kind and respectful in all interactions.

---

## SSoC Contributors

Welcome to **Social Summer of Code**! Here’s what you need to know:

### Quick start for SSoC

1. Go to the [Issues](https://github.com/praveenscience/One-File-Tools/issues) tab.
2. Filter by `Easy` or `Medium` labels.
3. Find an unassigned issue.
4. Comment: _“I’d like to work on this as a part of SSoC”_.
5. Wait for assignment (do not start before being assigned).
6. Fork, build, and submit your PR.
7. Include `SSoC` in your PR description for tracking.
8. Include the “Fixes: #Issue” as a part.

### SSoC ground rules

- **One issue at a time:** Complete your current task before picking up another.
- **Claim before you code:** Always get assigned first.
- **Original work only:** AI-generated tools without understanding will be rejected. You should be able to explain every line of your code.
- **No spam PRs:** Low-effort PRs (renaming variables, adding unnecessary comments, trivial whitespace changes) will be closed and may result in being blocked.
- **Ask questions:** If you’re stuck, comment on the issue. The maintainer and community are here to help.

### Earning points

- Your contribution earns points based on the difficulty label of the issue.
- Points are tracked on the [SSoC leaderboard](https://portal.socialsummerofcode.com/leaderboard).
- Quality matters more than quantity - one well-built tool is worth more than five half-finished ones.

---

## Need Help?

- **Stuck on something?** Comment on the issue you’re working on.
- **Not sure which tool to pick?** Look for issues labeled `Easy` and `good first issue`.
- **Found a bug?** Use the [Bug Report](https://github.com/praveenscience/One-File-Tools/issues/new?template=bug-report.yml) template.
- **Have a tool idea?** Use the [New Tool Idea](https://github.com/praveenscience/One-File-Tools/issues/new?template=new-tool-idea.yml) template.
- **General questions?** Open a discussion or reach out to the maintainer.

---

<p align="center">
  <strong>Happy building!</strong>
  <br>
  Every contribution makes this project better for developers everywhere.
</p>
