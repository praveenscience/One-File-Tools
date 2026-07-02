# Contributing a Portfolio Theme

Thank you for contributing a portfolio theme to One File Tools! This guide will walk you through the entire process, step by step.

---

## What you're building

A **single Handlebars template** (`.hbs` file) that turns `data/profile.json` data into a stunning portfolio website. When someone runs `node scripts/theme-gen.js`, your template gets filled with real data and outputs a standalone `.html` page.

Think of it like a mail merge — you design the layout, the data gets plugged in automatically.

### Example

```
portfolio/developer.hbs    <- you create this (template)
portfolio/developer.png    <- you create this (screenshot)
portfolio/developer.html   <- generated automatically (don't commit this)
```

---

## Before you start

1. Check [existing themes](#existing-themes) below so you don't duplicate a style
2. Open an [issue](https://github.com/praveenscience/One-File-Tools/issues) to claim the theme you want to build
3. Look at `data/profile.json` — this is the data your template will use
4. Look at `portfolio/developer.hbs` — this is a working example you can learn from

---

## Step-by-step guide

### 1. Fork, clone, and install

```bash
git clone https://github.com/YOUR-USERNAME/One-File-Tools.git
cd One-File-Tools
npm install
```

### 2. Create a branch

Pick a short, descriptive ID for your theme (e.g., `creative`, `minimal`, `designer`, `dark`):

```bash
git checkout -b add/portfolio-theme-creative
```

### 3. Create your template file

```bash
touch portfolio/creative.hbs
```

### 4. Write your template

Your file is a standard HTML page with Handlebars placeholders. Here's a starter skeleton:

```handlebars
<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>{{displayName}} — Portfolio</title>
<style>
  /* === Reset === */
  *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }

  /* === Base === */
  body {
    font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
    font-size: 16px;
    line-height: 1.6;
    color: #1a1a1a;
    background: #fafafa;
  }

  a { color: #2563eb; text-decoration: none; }

  .container { max-width: 960px; margin: 0 auto; padding: 0 24px; }

  /* Your styles here */
</style>
</head>
<body>

<div class="container">

  <!-- Hero -->
  <header>
    {{#photo}}<img src="{{photo}}" alt="{{displayName}}" />{{/photo}}
    <h1>{{displayName}}</h1>
    {{#title}}<p>{{title}}</p>{{/title}}
    {{#bio}}<p>{{bio}}</p>{{/bio}}
    <nav>
      {{#email}}<a href="mailto:{{email}}">Email</a>{{/email}}
      {{#website}}<a href="{{website}}">{{stripProtocol website}}</a>{{/website}}
      {{#socialLinks}}<a href="{{url}}">{{label}}</a>{{/socialLinks}}
    </nav>
  </header>

  <!-- Projects -->
  {{#has projects}}
  <section>
    <h2>Projects</h2>
    {{#projects}}
    <article>
      <h3>{{name}}</h3>
      {{#tagline}}<p>{{tagline}}</p>{{/tagline}}
      {{#description}}<p>{{description}}</p>{{/description}}
      {{#has techStack}}
      <div>
        {{#techStack}}<span>{{.}}</span>{{/techStack}}
      </div>
      {{/has}}
      {{#liveUrl}}<a href="{{liveUrl}}">Live</a>{{/liveUrl}}
      {{#repoUrl}}<a href="{{repoUrl}}">Source</a>{{/repoUrl}}
    </article>
    {{/projects}}
  </section>
  {{/has}}

  <!-- Skills -->
  {{#has skills}}
  <section>
    <h2>Skills</h2>
    {{#skills}}
    <div>
      <h3>{{category}}</h3>
      {{#items}}
      <span>{{name}} ({{level}})</span>
      {{/items}}
    </div>
    {{/skills}}
  </section>
  {{/has}}

  <!-- Add more sections as needed (see Available Data below) -->

</div>

<footer>
  <p>Built with <a href="{{toolsUrl}}">One File Tools</a></p>
</footer>

</body>
</html>
```

### 5. Test it

```bash
node scripts/theme-gen.js
open portfolio/creative.html
```

Edit your `.hbs`, run `node scripts/theme-gen.js` again, refresh the browser. Repeat until you're happy.

### 6. Take a screenshot

Save it as `portfolio/creative.png` (same name as your `.hbs` file). Recommended size: **1280x720** (16:9 aspect ratio).

### 7. Register in data/themes.json

Open `data/themes.json` and add your entry to the `"portfolio"` array:

```json
{
  "id": "creative",
  "name": "Creative",
  "description": "A bold, colorful portfolio with large project cards and smooth animations.",
  "author": "Your Name"
}
```

That's it — just `id`, `name`, `description`, `author`. All file paths are derived from the `id` automatically:

| Derived path | Purpose |
|---|---|
| `portfolio/creative.hbs` | Your Handlebars template |
| `portfolio/creative.png` | Your screenshot |
| `portfolio/creative.html` | Generated output (gitignored) |

### 8. Commit and push

```bash
git add portfolio/creative.hbs portfolio/creative.png data/themes.json
git commit -m "Add: portfolio theme — creative"
git push origin add/portfolio-theme-creative
```

Then open a Pull Request on GitHub.

> **Don't commit** `portfolio/creative.html` — it's generated and gitignored.

---

## Available data

Your template receives these fields from `data/profile.json`. Use whichever ones fit your design — you don't need to include them all.

### Personal & contact

| Field | Type | Example |
|-------|------|---------|
| `displayName` | string | `"Jane Doe"` |
| `title` | string | `"Senior Full Stack Developer"` |
| `headline` | string | `"Building scalable web applications"` |
| `bio` | string | A short paragraph about the person |
| `email` | string | `"jane@example.com"` |
| `phone` | string | `"+1-555-0123"` |
| `website` | string | `"https://janedoe.dev"` |
| `photo` | string | URL to a photo |
| `locationStr` | string | `"San Francisco, California (Remote)"` |
| `isRemote` | boolean | `true` |
| `socialLinks` | array | `[{ key, url, label }]` — GitHub, LinkedIn, etc. |

### Content sections

| Field | Type | Item fields |
|-------|------|-------------|
| `summary` | string | — (just a paragraph) |
| `experience` | array | `company`, `role`, `location`, `startDate`, `endDate`, `description`, `highlights[]` |
| `education` | array | `institution`, `degree`, `field`, `startDate`, `endDate`, `gpa`, `honors[]` |
| `skills` | array | `category`, `items[{ name, level }]` — levels: `expert`, `advanced`, `intermediate`, `beginner` |
| `projects` | array | `name`, `tagline`, `description`, `techStack[]`, `highlights[]`, `liveUrl`, `repoUrl`, `year`, `featured`, `category` |
| `certifications` | array | `name`, `issuer`, `date` |
| `publications` | array | `title`, `publisher`, `date`, `url` |
| `talks` | array | `title`, `event`, `date`, `location`, `slidesUrl`, `videoUrl` |
| `awards` | array | `title`, `issuer`, `date`, `description` |
| `testimonials` | array | `quote`, `author`, `role`, `company` |
| `languages` | array | `language`, `proficiency` |
| `volunteer` | array | `organization`, `role`, `startDate`, `endDate`, `description` |
| `interests` | array of strings | `["Open Source", "Rock Climbing", ...]` |

### Meta

| Field | Type | Value |
|-------|------|-------|
| `toolsUrl` | string | Link to the GitHub repo |
| `siteUrl` | string | Link to the live site |

---

## Handlebars patterns

### Display a field

```handlebars
{{displayName}}
{{email}}
```

### Conditionally show a section (only if data exists)

Use `{{#has}}` for arrays and objects:

```handlebars
{{#has projects}}
<section>
  <h2>Projects</h2>
  ...
</section>
{{/has}}
```

Use `{{#fieldName}}` for strings (renders if non-empty):

```handlebars
{{#bio}}
<p>{{bio}}</p>
{{/bio}}
```

### Loop through an array

```handlebars
{{#projects}}
<article>
  <h3>{{name}}</h3>
  <p>{{description}}</p>
</article>
{{/projects}}
```

### Loop through a string array

```handlebars
{{#techStack}}<span>{{.}}</span>{{/techStack}}
```

### Check if NOT the last item (for comma-separated lists)

```handlebars
{{#items}}{{name}}{{^@last}}, {{/@last}}{{/items}}
```

### Conditional fields inside a loop

Use `{{#if}}` instead of `{{#fieldName}}` when inside a loop (avoids Handlebars context-switching issues):

```handlebars
{{#testimonials}}
<cite>{{author}}{{#if role}}, {{role}}{{/if}}{{#if company}} at {{company}}{{/if}}</cite>
{{/testimonials}}
```

---

## Available helpers

| Helper | Usage | Output |
|--------|-------|--------|
| `fmtDate` | `{{fmtDate startDate}}` | `"2022-03"` becomes `"Mar 2022"`, `null` becomes `"Present"` |
| `year` | `{{year}}` | Current year (e.g., `2026`) |
| `eq` | `{{#if (eq level "expert")}}` | Equality check |
| `join` | `{{join interests ", "}}` | `"Open Source, Rock Climbing, Photography"` |
| `joinField` | `{{joinField items "name" ", "}}` | Join array of objects by a specific field |
| `lowercase` | `{{lowercase level}}` | `"Expert"` becomes `"expert"` |
| `levelPercent` | `{{levelPercent level}}` | `"expert"` becomes `95`, `"advanced"` becomes `80`, `"intermediate"` becomes `60`, `"beginner"` becomes `35` |
| `has` | `{{#has projects}}...{{/has}}` | Truthy check — works with arrays, strings, and objects |
| `stripProtocol` | `{{stripProtocol website}}` | `"https://janedoe.dev"` becomes `"janedoe.dev"` |

---

## Portfolio-specific tips

- **Lead with projects**: Portfolios are about showcasing work — put projects front and center
- **Visual impact**: Use large cards, images, color, and whitespace — portfolios should look impressive
- **Show tech stack**: Visitors want to quickly see what technologies you use
- **Hero section**: Start with a strong intro — name, title, bio, photo, and social links
- **Project links**: Always include "Live" and "Source" links when available
- **Testimonials**: Social proof goes a long way — include them if the data has them
- **Dark mode**: Consider a dark theme or a dark/light toggle — developers love dark mode
- **Responsive**: Test on mobile — portfolios are often viewed on phones
- **Google Fonts are OK**: Unlike resumes, portfolios benefit from distinctive typography. Use `@import` in your `<style>` block
- **Animations are OK**: Subtle CSS transitions and hover effects make portfolios feel polished. Keep it CSS-only (no JavaScript)

---

## Existing themes

| ID | Name | Style |
|----|------|-------|
| `developer` | Developer | Dark theme, Inter font, project cards, skills grid, experience timeline, testimonials |

---

## Checklist before submitting

- [ ] Template is a single `.hbs` file in `portfolio/`
- [ ] All HTML, CSS in one file — CDN links for libraries and fonts are fine
- [ ] Works by opening the generated `.html` in a browser
- [ ] Responsive — looks good on desktop, tablet, and mobile
- [ ] Screenshot saved as `portfolio/[id].png` (1280x720 recommended)
- [ ] Entry added to `data/themes.json` under `"portfolio"`
- [ ] No console errors
- [ ] Footer includes link back to One File Tools
- [ ] Projects section is visually prominent
