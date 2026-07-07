# 🚀 HOW TO CREATE PULL REQUEST

## Overview
This guide explains how to submit your contributions to One-File-Tools repository.

## What Was Built
| Type | Name | Difficulty | Points |
|------|------|-----------|--------|
| Tool | Binary Decimal Converter | Easy | 20 |
| Tool | Color Mixer Tool | Easy | 20 |
| Tool | Markdown Table Generator | Easy | 20 |
| Tool | Screen Resolution Tester | Easy | 20 |
| Tool | JSON Schema Validator | Medium | 30 |
| Quest | CSS Grid Quest | Easy | 20 |

**Total: 130 Points**

---

## Step 1: Fork the Repository

1. Go to: https://github.com/praveenscience/One-File-Tools
2. Click **Fork** button (top right corner)
3. Wait for fork to complete

## Step 2: Clone Your Fork

```bash
git clone https://github.com/YOUR-USERNAME/One-File-Tools.git
cd One-File-Tools
```

## Step 3: Add Upstream Remote

```bash
git remote add upstream https://github.com/praveenscience/One-File-Tools.git
git remote -v
```

## Step 4: Sync with Upstream

```bash
git fetch upstream
git checkout main
git merge upstream/main
```

## Step 5: Create New Branch

```bash
git checkout -b add-contributions-batch
```

## Step 6: Apply Changes

Since we already have the changes committed locally, cherry-pick them:

```bash
git cherry-pick b106aa4
```

Or if that doesn't work, manually create the files:

### Files to Create:

**Quests:**
```
quests/css-grid-quest.html
quests/css-grid-quest.png
```

**Tools:**
```
tools/binary-decimal-converter.html
tools/binary-decimal-converter.png
tools/color-mixer-tool.html
tools/color-mixer-tool.png
tools/markdown-table-generator.html
tools/markdown-table-generator.png
tools/screen-resolution-tester.html
tools/screen-resolution-tester.png
tools/json-schema-validator.html
tools/json-schema-validator.png
```

**Data Updates:**
```
data/tools.json (add new tool entries)
data/quests.json (add new quest entry)
```

## Step 7: Commit Changes

```bash
git add .
git commit -m "Add: 5 Tools + 1 Quest

Tools:
- Binary Decimal Converter
- Color Mixer Tool
- Markdown Table Generator
- Screen Resolution Tester
- JSON Schema Validator

Quest:
- CSS Grid Quest

Points: 130"
```

## Step 8: Push to Your Fork

```bash
git push -u origin add-contributions-batch
```

## Step 9: Create Pull Request

1. Go to: https://github.com/praveenscience/One-File-Tools
2. You'll see yellow banner: "Add contributions-batch had recent pushes"
3. Click **"Compare & pull request"**
4. Fill in the PR template below

---

## PR Template

```markdown
## Pull Request: Add 5 Developer Tools + 1 Learning Quest

### Summary
Added 5 new developer tools and 1 interactive learning quest to the collection.

### Changes Made

#### New Tools
| Tool | Description | Points |
|------|-------------|--------|
| Binary Decimal Converter | Convert between binary, decimal, hex, octal | 20 |
| Color Mixer Tool | Mix colors and generate palettes | 20 |
| Markdown Table Generator | Visual Markdown table creator | 20 |
| Screen Resolution Tester | Test responsive designs | 20 |
| JSON Schema Validator | Validate JSON against schemas | 30 |

#### New Quest
| Quest | Description | Points |
|-------|-------------|--------|
| CSS Grid Quest | Interactive CSS Grid learning game | 20 |

### Files Added
- `tools/binary-decimal-converter.html` & `.png`
- `tools/color-mixer-tool.html` & `.png`
- `tools/markdown-table-generator.html` & `.png`
- `tools/screen-resolution-tester.html` & `.png`
- `tools/json-schema-validator.html` & `.png`
- `quests/css-grid-quest.html` & `.png`

### Files Modified
- `data/tools.json` - Added tool registry entries
- `data/quests.json` - Added quest registry entry

### Testing
- [x] All tools work offline
- [x] Dark mode support verified
- [x] No console errors
- [x] Responsive design tested
- [x] Keyboard accessible

### Total Points: 130

Labels: enhancement, gsoc-2026
```

---

## Quick Links

| Resource | URL |
|----------|-----|
| Repository | https://github.com/praveenscience/One-File-Tools |
| Issues | https://github.com/praveenscience/One-File-Tools/issues |
| Your Fork | https://github.com/YOUR-USERNAME/One-File-Tools |

---

## Troubleshooting

### Cherry-pick failed?
```bash
git cherry-pick --abort
# Then manually copy the files
```

### Merge conflicts?
```bash
git merge upstream/main
# Resolve conflicts manually
git add .
git commit -m "Merge upstream/main"
```

### Push rejected?
```bash
git pull --rebase origin main
git push origin add-contributions-batch --force
```

---

## Questions?

Open an issue at: https://github.com/praveenscience/One-File-Tools/issues/new
