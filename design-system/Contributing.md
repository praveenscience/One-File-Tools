# Contributing a Design

Thank you for contributing to the Design System pillar of One File Tools! This is the place to showcase creative, premium UI builds — dashboards, landing pages, components, and more — each as a single HTML file using any CSS framework or JS library via CDN.

---

## What you're building

A **single, self-contained HTML file** that demonstrates a polished UI design. Unlike tools (which solve a problem) or quests (which teach through interaction), designs are purely about **creative UI craft** — beautiful, functional interfaces built with modern frameworks.

### What's allowed

- **CSS frameworks via CDN** — Tailwind CSS, Bootstrap, Bulma, UnoCSS, etc.
- **JS libraries via CDN** — Alpine.js, HTMX, Lit, Petite Vue, Chart.js, etc.
- **Google Fonts and icon CDNs** — same as tools
- **Any combination** — mix and match frameworks to showcase your stack

### Example

```
design-system/analytics-dashboard.html    <- your design (one file, everything inside)
design-system/analytics-dashboard.png     <- screenshot of your design
```

---

## Before you start

1. Check [existing designs](../ReadMe.md) so you don't duplicate one
2. Open an [issue](https://github.com/praveenscience/One-File-Tools/issues) or comment on an existing one to claim it
3. **Wait for assignment** before starting
4. Look at existing tools in `tools/` for the coding conventions this repo follows

---

## Step-by-step guide

### 1. Fork, clone, and install

```bash
git clone https://github.com/YOUR-USERNAME/One-File-Tools.git
cd One-File-Tools
npm install
```

### 2. Create a branch

```bash
git checkout -b add/design-name
```

### 3. Create your file

Use kebab-case, matching your design's `id`:

```bash
touch design-system/analytics-dashboard.html
```

### 4. Build your design

Write a single HTML file with all CSS/JS inline or loaded via CDN. Focus on:

- **Visual polish** — premium feel, attention to spacing, typography, color
- **Responsiveness** — works on mobile, tablet, and desktop
- **Dark/light mode** — support both where possible
- **Accessibility** — semantic HTML, good contrast, keyboard navigable
- **Interactivity** — hover states, transitions, working UI elements (tabs, dropdowns, etc.)

Your design should feel like a polished, production-ready piece — not a wireframe.

### 5. Register your design in data/design-system.json

Open `data/design-system.json` and add an entry to the `"designs"` array:

```json
{
  "id": "analytics-dashboard",
  "name": "Analytics Dashboard",
  "shortDescription": "A data-rich admin dashboard with charts, stats cards, and a responsive sidebar.",
  "longDescription": "## Analytics Dashboard\n\nA modern admin dashboard built with Tailwind CSS and Chart.js.\n\n### Features\n\n- Responsive sidebar navigation\n- Interactive charts and graphs\n- Stats cards with trend indicators\n- Dark/light mode toggle",
  "category": "dashboards",
  "tags": ["dashboard", "admin", "charts", "responsive"],
  "techStack": ["HTML5", "Tailwind CSS", "Chart.js"],
  "frameworks": ["Tailwind CSS", "Chart.js"],
  "difficulty": "Medium",
  "status": "live"
}
```

#### Field reference

| Field | Description |
|-------|-------------|
| `id` | Kebab-case, matches filename without `.html` |
| `name` | Human-readable display name |
| `shortDescription` | One sentence shown on the card |
| `longDescription` | Markdown — shown in the detail modal |
| `category` | One of the valid category IDs below |
| `tags` | Array of lowercase keywords for search |
| `techStack` | Array of technologies used |
| `frameworks` | Array of CDN-loaded CSS/JS frameworks (displayed as badges) |
| `difficulty` | `Easy`, `Medium`, or `Hard` |
| `status` | `live` (built) or `idea` (placeholder) |

#### Valid category IDs

| ID | Display name |
|----|-------------|
| `components` | Components |
| `dashboards` | Dashboards |
| `e-commerce` | E-Commerce |
| `landing-pages` | Landing Pages |
| `portfolios` | Portfolios |
| `social` | Social |

If your design doesn't fit an existing category, propose a new one in your issue first.

### 6. Add a screenshot

Save a screenshot as `design-system/your-design-name.png`:

- **1280x720** recommended resolution
- Show the design in its best state, not empty/loading
- Show both light and dark mode if supported (collage or pick the best one)

### 7. Sort and normalize

```bash
node scripts/sort-norm.js data/design-system.json
```

### 8. Build and verify

```bash
node scripts/build.js
open index.html
```

Click the **Design System** pillar and confirm your design card appears correctly.

### 9. Test thoroughly

- [ ] Opens correctly in Chrome and Firefox
- [ ] Responsive on mobile (use browser dev tools)
- [ ] No console errors or warnings
- [ ] All interactive elements work (buttons, dropdowns, tabs, etc.)
- [ ] Dark/light mode works if implemented
- [ ] Keyboard accessible — can tab through interactive elements
- [ ] Screenshot accurately represents the design

### 10. Format, commit, push

```bash
npm run format
git add design-system/your-design-name.html design-system/your-design-name.png data/design-system.json
git commit -m "Add: your-design-name"
git push origin add/design-name
```

Then open a Pull Request.

---

## Design requirements

### Must have

- Single `.html` file — everything self-contained
- Frameworks loaded via CDN only (no `node_modules`, no build step)
- Responsive layout (works at 320px through 1920px+)
- Semantic HTML (`<nav>`, `<main>`, `<section>`, `<article>`, etc.)
- No console errors

### Should have

- Dark/light mode support
- Smooth transitions and hover states
- Good typography and spacing
- Accessible color contrast (WCAG AA minimum)
- Keyboard navigation support

### Must not have

- Server-side code or API calls to private endpoints
- Hardcoded personal data (use placeholder/dummy data)
- Copied templates from paid theme marketplaces
- JS frameworks that require a build step (React, Vue SFC, Angular)
- Minified or obfuscated code — keep it readable

---

## PR format

Same as tools: `Add: design-name`, link the issue with `Closes #123`, include a screenshot, confirm the checklist.
