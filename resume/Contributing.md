# Contributing a Resume Theme

Thank you for contributing a resume theme to One File Tools! This guide will walk you through the entire process, step by step.

---

## What you're building

A **single Handlebars template** (`.hbs` file) that turns `data/profile.json` data into a beautiful, print-ready HTML resume. When someone runs `node scripts/theme-gen.js`, your template gets filled with real data and outputs a standalone `.html` page.

Think of it like a mail merge — you design the layout, the data gets plugged in automatically.

### Example

```
resume/classic.hbs    <- you create this (template)
resume/classic.png    <- you create this (screenshot)
resume/classic.html   <- generated automatically (don't commit this)
```

---

## Before you start

1. Check [existing themes](#existing-themes) below so you don't duplicate a style
2. Open an [issue](https://github.com/praveenscience/One-File-Tools/issues) to claim the theme you want to build
3. Look at `data/profile.json` — this is the data your template will use
4. Look at `resume/classic.hbs` — this is a working example you can learn from

---

## Step-by-step guide

### 1. Fork, clone, and install

```bash
git clone https://github.com/YOUR-USERNAME/One-File-Tools.git
cd One-File-Tools
npm install
```

### 2. Create a branch

Pick a short, descriptive ID for your theme (e.g., `minimal`, `modern`, `elegant`, `two-column`):

```bash
git checkout -b add/resume-theme-minimal
```

### 3. Create your template file

```bash
touch resume/minimal.hbs
```

### 4. Write your template

Your file is a standard HTML page with Handlebars placeholders. Here's a starter skeleton:

```handlebars
<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>{{displayName}} — Resume</title>
<style>
  /* === Reset === */
  *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }

  /* === Base === */
  body {
    font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
    font-size: 11pt;
    line-height: 1.5;
    color: #1a1a1a;
    background: #fff;
  }

  /* === Print === */
  @page { size: A4; margin: 15mm 20mm; }
  @media print {
    body { background: #fff; }
  }

  /* Your styles here */
</style>
</head>
<body>

<!-- Header -->
<header>
  <h1>{{displayName}}</h1>
  {{#title}}<p>{{title}}</p>{{/title}}
  <p>
    {{#email}}<a href="mailto:{{email}}">{{email}}</a>{{/email}}
    {{#phone}} | {{phone}}{{/phone}}
    {{#website}} | <a href="{{website}}">{{stripProtocol website}}</a>{{/website}}
    {{#locationStr}} | {{locationStr}}{{/locationStr}}
  </p>
</header>

<!-- Summary -->
{{#summary}}
<section>
  <h2>Summary</h2>
  <p>{{summary}}</p>
</section>
{{/summary}}

<!-- Experience -->
{{#has experience}}
<section>
  <h2>Experience</h2>
  {{#experience}}
  <div>
    <h3>{{role}}</h3>
    <p>{{company}} | {{fmtDate startDate}} — {{fmtDate endDate}}</p>
    {{#description}}<p>{{description}}</p>{{/description}}
    {{#has highlights}}
    <ul>
      {{#highlights}}<li>{{.}}</li>{{/highlights}}
    </ul>
    {{/has}}
  </div>
  {{/experience}}
</section>
{{/has}}

<!-- Education -->
{{#has education}}
<section>
  <h2>Education</h2>
  {{#education}}
  <div>
    <h3>{{degree}}{{#field}} in {{field}}{{/field}}</h3>
    <p>{{institution}} | {{fmtDate startDate}} — {{fmtDate endDate}}</p>
  </div>
  {{/education}}
</section>
{{/has}}

<!-- Skills -->
{{#has skills}}
<section>
  <h2>Skills</h2>
  {{#skills}}
  <div>
    <strong>{{category}}:</strong>
    {{#items}}{{name}}{{^@last}}, {{/@last}}{{/items}}
  </div>
  {{/skills}}
</section>
{{/has}}

<!-- Add more sections as needed (see Available Data below) -->

<footer>
  <p>Built with <a href="{{toolsUrl}}">One File Tools</a></p>
</footer>

</body>
</html>
```

### 5. Test it

```bash
node scripts/theme-gen.js
open resume/minimal.html
```

Edit your `.hbs`, run `node scripts/theme-gen.js` again, refresh the browser. Repeat until you're happy.

### 6. Take a screenshot

Save it as `resume/minimal.png` (same name as your `.hbs` file). Recommended size: **1280x720** (16:9 aspect ratio).

### 7. Register in data/themes.json

Open `data/themes.json` and add your entry to the `"resume"` array:

```json
{
  "id": "minimal",
  "name": "Minimal",
  "description": "A clean, minimalist resume with generous whitespace and subtle typography.",
  "author": "Your Name"
}
```

That's it — just `id`, `name`, `description`, `author`. All file paths are derived from the `id` automatically:

| Derived path | Purpose |
|---|---|
| `resume/minimal.hbs` | Your Handlebars template |
| `resume/minimal.png` | Your screenshot |
| `resume/minimal.html` | Generated output (gitignored) |

### 8. Commit and push

```bash
git add resume/minimal.hbs resume/minimal.png data/themes.json
git commit -m "Add: resume theme — minimal"
git push origin add/resume-theme-minimal
```

Then open a Pull Request on GitHub.

> **Don't commit** `resume/minimal.html` — it's generated and gitignored.

---

## Available data

Your template receives these fields from `data/profile.json`. Use whichever ones fit your design — you don't need to include them all.

### Personal & contact

| Field | Type | Example |
|-------|------|---------|
| `displayName` | string | `"Jane Doe"` |
| `title` | string | `"Senior Full Stack Developer"` |
| `headline` | string | `"Building scalable web applications"` |
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
| `projects` | array | `name`, `tagline`, `description`, `techStack[]`, `highlights[]`, `liveUrl`, `repoUrl`, `year` |
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
{{#has experience}}
<section>
  <h2>Experience</h2>
  ...
</section>
{{/has}}
```

Use `{{#fieldName}}` for strings (renders if non-empty):

```handlebars
{{#summary}}
<p>{{summary}}</p>
{{/summary}}
```

### Loop through an array

```handlebars
{{#experience}}
<div>
  <h3>{{role}} at {{company}}</h3>
  <span>{{fmtDate startDate}} — {{fmtDate endDate}}</span>
</div>
{{/experience}}
```

### Loop through a string array

```handlebars
{{#interests}}<span>{{.}}</span>{{/interests}}
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
| `has` | `{{#has experience}}...{{/has}}` | Truthy check — works with arrays, strings, and objects |
| `stripProtocol` | `{{stripProtocol website}}` | `"https://janedoe.dev"` becomes `"janedoe.dev"` |

---

## Resume-specific tips

- **Print-ready**: Add `@page { size: A4; margin: 15mm 20mm; }` and a `@media print` block
- **ATS-friendly**: Use semantic HTML (`<h1>`, `<h2>`, `<section>`, `<ul>`) — applicant tracking systems parse these
- **Font sizing**: Use `pt` units for print (`10pt`–`12pt` body, `18pt`–`22pt` name)
- **Keep it to 1–2 pages**: A resume should be concise — don't try to show everything
- **Avoid JavaScript**: Resumes should work as pure HTML/CSS for maximum compatibility
- **Test printing**: Open your `.html` in Chrome, hit Ctrl/Cmd+P, and check the print preview

---

## Existing themes

| ID | Name | Style |
|----|------|-------|
| `classic` | Classic | Clean single-column, A4 print-ready, blue accent, system fonts |

---

## Checklist before submitting

- [ ] Template is a single `.hbs` file in `resume/`
- [ ] All HTML, CSS in one file — no external dependencies required
- [ ] Works by opening the generated `.html` in a browser
- [ ] Responsive — looks good on desktop and mobile
- [ ] Print-ready — clean output when printing to PDF
- [ ] Screenshot saved as `resume/[id].png` (1280x720 recommended)
- [ ] Entry added to `data/themes.json` under `"resume"`
- [ ] No console errors
- [ ] Footer includes link back to One File Tools
