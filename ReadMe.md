# One File Tools

A growing collection of useful developer tools, each built as a **single, self-contained HTML file**.

No build step. No dependencies. No frameworks. Just open the file in your browser and it works.

![Thumbnail](./thumb.png)

## Why?

Most developer tools today come with baggage:

- `npm install` with 200+ packages.
- Framework lock-in.
- Complex build pipelines.
- Servers, databases, deployment configs.

**This repo takes the opposite approach.**

> One tool. One file. Open and use.

Every tool in this collection is a standalone `.html` file containing all the HTML, CSS, and JavaScript it needs. You can download a single file, open it in any browser, and start using it immediately, even offline.

## Available Tools

<!--
  As tools are added, update this table.
  Keep it alphabetical within each category.
-->

| # | Tool | Category | Description | Live |
|---|------|----------|-------------|------|
| 1 | [Aspect Ratio Calculator](tools/aspect-ratio-calculator.html) | Image Tools | Calculate and simplify aspect ratios instantly. Supports common presets and outputs decimal ratio and CSS padding-bottom values. | [Try it](https://one-file-tools.pages.dev/tools/aspect-ratio-calculator) |
| 2 | [Border Radius Generator](tools/border-radius-generator.html) | CSS Tools | Visually create CSS border-radius values with live preview, presets, and copy-ready CSS output. | [Try it](https://one-file-tools.pages.dev/tools/border-radius-generator) |
| 3 | [Clip Path Generator](tools/clip-path-generator.html) | CSS Tools | Visually create complex CSS clip-path shapes and instantly copy the generated code. | [Try it](https://one-file-tools.pages.dev/tools/clip-path-generator) |
| 4 | [Favicon Generator](tools/favicon-generator.html) | Developer Utilities | Generate a complete favicon pack and integration tags from any image, offline. | [Try it](https://one-file-tools.pages.dev/tools/favicon-generator) |
| 5 | [GitHub Token Validator Plain](tools/github-token-validator-plain.html) | Developer Utilities | Validate GitHub personal access tokens with a plain terminal-style interface. | [Try it](https://one-file-tools.pages.dev/tools/github-token-validator-plain) |
| 6 | [JSON Formatter](tools/json-formatter.html) | JSON & API | Format, validate, and minify JSON locally in your browser. | [Try it](https://one-file-tools.pages.dev/tools/json-formatter) |
| 7 | [Open Graph Inspector](tools/open-graph-inspector.html) | Web & SEO | Analyze meta tags, social previews, and SEO metadata for any URL with actionable scores. | [Try it](https://one-file-tools.pages.dev/tools/open-graph-inspector) |
| 8 | [UUID Generator](tools/uuid-generator.html) | Developer Utilities | Generate random v4 UUIDs instantly, offline. | [Try it](https://one-file-tools.pages.dev/tools/uuid-generator) |


> **Want to see your tool here?** Check out the [Contributing Guide](Contributing.md) and pick an idea from the [Ideas Board](#ideas-board).

## Ideas Board

Below is a curated list of tool ideas waiting to be built. Each idea is a potential contribution. If you’re participating in **SSoC** or just want to contribute, pick one and start building!

### Web & SEO

| Idea                                                           | Difficulty |
| -------------------------------------------------------------- | ---------- |
| Open Graph Generator — generate OG meta tags and preview cards | Easy       |
| Open Graph Checker — validate existing OG tags from a URL      | Medium     |
| Meta Tag Generator — create standard HTML meta tags            | Easy       |
| Twitter / X Card Preview — preview how links appear on Twitter | Easy       |
| Robots.txt Generator — build a `robots.txt` file visually      | Easy       |
| Sitemap Generator — create XML sitemaps                        | Medium     |
| Canonical URL Checker — verify canonical tag setup             | Medium     |
| JSON-LD / Schema.org Generator — build structured data         | Medium     |
| Hreflang Tag Generator — generate multi-language link tags     | Easy       |

### Image Tools

| Idea                                                                 | Difficulty |
| -------------------------------------------------------------------- | ---------- |
| Image Dimension Checker — inspect width, height, and aspect ratio    | Easy       |
| Responsive Image Simulator — preview images at different breakpoints | Medium     |
| ~~Aspect Ratio Calculator~~ — ✅ [Built](tools/aspect-ratio-calculator.html) | Easy       |
| SVG Previewer — paste and preview SVG code instantly                 | Easy       |
| Base64 Image Converter — convert images to/from Base64               | Easy       |
| ~~Favicon Generator~~ — ✅ [Built](tools/favicon-generator.html)     | Medium     |
| Image Metadata Viewer — read EXIF and other metadata                 | Medium     |
| Color Palette Extractor — extract dominant colors from an image      | Medium     |

### Color Tools

| Idea                                                       | Difficulty |
| ---------------------------------------------------------- | ---------- |
| Color Picker — pick colors with HEX, RGB, HSL output       | Easy       |
| Contrast Checker — verify WCAG contrast ratios             | Easy       |
| Palette Generator — generate harmonious color palettes     | Medium     |
| Gradient Builder — create CSS gradients visually           | Easy       |
| CSS Color Converter — convert between HEX, RGB, HSL, OKLCH | Easy       |
| Tailwind Color Finder — find the closest Tailwind color    | Easy       |

### CSS Tools

| Idea                                                        | Difficulty |
| ----------------------------------------------------------- | ---------- |
| Box Shadow Generator — design box shadows with live preview | Easy       |
| ~~Border Radius Generator~~ — ✅ [Built](tools/border-radius-generator.html) | Easy       |

| Neumorphism Generator — create soft UI / neumorphic styles  | Easy       |
| CSS Grid Generator — build CSS Grid layouts visually        | Medium     |
| Flexbox Playground — experiment with Flexbox properties     | Medium     |

| CSS Unit Converter — convert between px, rem, em, vw, vh    | Easy       |
| Animation Cubic-Bezier Editor — design easing curves        | Medium     |

### Text & Content

| Idea                                                          | Difficulty |
| ------------------------------------------------------------- | ---------- |
| Lorem Ipsum Generator — generate placeholder text             | Easy       |
| Word / Character Counter — count words, characters, sentences | Easy       |
| Case Converter — transform text between cases                 | Easy       |
| Slug Generator — convert text to URL-friendly slugs           | Easy       |
| Markdown Previewer — write and preview Markdown in real time  | Medium     |
| Text Diff Viewer — compare two blocks of text side by side    | Medium     |
| Unicode Inspector — inspect Unicode characters and codepoints | Easy       |

### JSON & API

| Idea                                                     | Difficulty |
| -------------------------------------------------------- | ---------- |
| JSON Diff Viewer — compare two JSON objects              | Medium     |
| JWT Decoder — decode and inspect JSON Web Tokens         | Easy       |
| URL Encoder / Decoder — encode and decode URL strings    | Easy       |
| Base64 Encoder / Decoder — encode and decode Base64      | Easy       |
| Curl Builder — build curl commands visually              | Medium     |
| Query String Builder — build and parse URL query strings | Easy       |
| YAML ↔ JSON Converter — convert between YAML and JSON formats | Easy |

### Developer Utilities

| Idea                                                         | Difficulty |
| ------------------------------------------------------------ | ---------- |
| Timestamp Converter — convert Unix timestamps to human dates | Easy       |
| Regex Tester — test regular expressions with live matching   | Medium     |
| Cron Expression Builder — build and explain cron schedules   | Medium     |
| Hash Generator — generate MD5, SHA-1, SHA-256 hashes         | Easy       |
| Password Generator — generate strong random passwords        | Easy       |
| QR Code Generator — create QR codes from text or URLs        | Easy       |
| Git Ignore Generator — generate .gitignore files for selected technologies | Easy |
| Commit Message Generator — create conventional commit messages | Easy |

### Browser & Network

| Idea                                                         | Difficulty |
| ------------------------------------------------------------ | ---------- |
| User Agent Parser — parse and explain user agent strings     | Easy       |
| Viewport / Screen Info — display device and viewport details | Easy       |
| Cookie Viewer — view and manage browser cookies              | Easy       |
| LocalStorage Explorer — browse and edit localStorage         | Easy       |
| HTTP Header Inspector — view response headers for a URL      | Medium     |

### Accessibility

| Idea                                                         | Difficulty |
| ------------------------------------------------------------ | ---------- |
| Contrast Checker (A11y) — WCAG 2.1 AA/AAA compliance checker | Easy       |
| Heading Structure Visualizer — visualize heading hierarchy   | Easy       |
| Alt Text Helper — preview and validate image alt text        | Easy       |
| ARIA Role Reference — quick reference for ARIA roles         | Easy       |

> **Don’t see your idea?** Use the [New Tool Idea](https://github.com/praveenscience/One-File-Tools/issues/new?template=new-tool-idea.yml) issue template to propose it!
>
> **Difficulty labels are assigned by the maintainer** ([@praveenscience](https://github.com/praveenscience)) and are slightly negotiable, feel free to discuss in your issue or PR.

## Getting Started

### Use a tool

```bash
# Clone the repo.
git clone https://github.com/praveenscience/One-File-Tools.git

# Open any tool in your browser.
open tools/json-formatter.html
```

Or just visit the [live site](https://one-file-tools.pages.dev) (hosted on Cloudflare Pages).

### Contribute a tool

```bash
# Fork the repo and create a branch based on what you wanna do, add / new is the same.
git checkout -b add/json-formatter
git checkout -b new/json-formatter
git checkout -b feat/json-formatter
git checkout -b fix/json-formatter

# Create your tool.
touch tools/json-formatter.html

# Commit and push, make a PR.
git add tools/json-formatter.html
git commit

# Make sure you give detailed commit messages that includes Fixes #ISSUE_NUM.
# If not creating a PR before getting the issue / idea assigned to you, it will be closed.

# Open Contributing.md for the full guide.
```

## Project Structure

```
One-File-Tools/
├── tools/                # All single-file tools live here.
│   ├── json-formatter.html
│   ├── color-picker.html
│   └── ...
├── Contributing.md       # Contribution guide.
├── index.html            # Landing page.
├── ReadMe.md             # ReadMe file.
├── LICENSE               # Unlicense (Public Domain).
└── .gitignore
```

## Tech Philosophy

| Principle             | Rule                                                                                        |
| --------------------- | ------------------------------------------------------------------------------------------- |
| **One file**          | Each tool is a single `.html` file.                                                         |
| **Zero dependencies** | No npm, no CDN required (CDN optional for styling).                                         |
| **Browser only**      | Runs entirely client-side.                                                                  |
| **Beginner friendly** | Code should be readable and learnable, even if AI is used, make sure to comment humane way. |
| **Works offline**     | No server calls unless the tool’s purpose requires it.                                      |
| **Mobile ready**      | Responsive design on every tool.                                                            |

## SSoC (Social Summer of Code)

This repository is a proud participant in **[Social Summer of Code (SSoC)](https://portal.socialsummerofcode.com/)**, an Open Source programme that helps students and beginners contribute to real-world projects.

### How SSoC works here

1. Browse the [Ideas Board](#ideas-board) or the [Issues](https://github.com/praveenscience/One-File-Tools/issues) tab
2. Pick an issue labeled `Easy` or `Medium`
3. Comment on the issue to get assigned
4. Follow the [Contributing Guide](Contributing.md) to submit your PR
5. Get your PR reviewed, merged, and earn your contribution points

### Contribution labels

| Label    | Points | What it means                                                                          |
| -------- | ------ | -------------------------------------------------------------------------------------- |
| `Easy`   | 20     | Straightforward tool: single feature, minimal logic / Enhancement of an existing tool. |
| `Medium` | 30     | More complex tool: multiple features, interactive UI.                                  |

> Difficulty is based on learning value and implementation complexity.
>
> - **Easy**: Simple tools that help contributors learn concepts in the simplest possible way.
> - **Medium**: Tools that provide a strong learning experience while remaining approachable and understandable.
>
> There are currently **no Hard labels** in this project. The one-file-tool philosophy keeps contributions focused, self-contained, and beginner-friendly.
>
> Contributors are encouraged to create polished user interfaces, thoughtful features, and strong learning experiences while keeping implementations simple and avoiding unnecessary complexity.
>
> Labels are assigned by the maintainer and are **slightly negotiable**, if you feel a difficulty is miscategorised, open a discussion.

### What counts as a valid contribution?

- **New Tool** — Build a tool from the Ideas Board or propose your own (Mostly `Easy`, some `Medium`).
- **Enhancement** — Improve an existing tool (better UI, new feature, accessibility fix, dark mode, responsiveness) (Mostly `Easy`).
- **Bug Fix** — Fix a broken tool (Mostly `Easy`).
- **Documentation** — Improve README, CONTRIBUTING, or add inline code comments (only `Easy`).

## Deployment

This project is designed for static hosting. Works perfectly on:

- **Cloudflare Pages** (primary)
- GitHub Pages
- Netlify
- Vercel
- Any static web server

## License

[Unlicense](LICENSE). This is free and unencumbered software released into the public domain. Do whatever you want with it.

---

<p align="center">
  <strong>Built by <a href="https://praveen.science">Praveen Kumar Purushothaman</a>.</strong>
  <br>
  Open Source with purpose. One file at a time.
</p>


