# Contributing a Quest

Thank you for contributing a quest to One File Tools! Quests are interactive, gamified lessons — think of them as playable tutorials, not one-shot utilities. This guide mirrors the [tools Contributing guide](../tools/Contributing.md), adjusted for quests.

---

## What you're building

A **single, self-contained HTML file** that teaches something through interaction — a Git branching simulator, a CSS specificity challenge, a JS closures puzzle. Same rules as tools: everything in one file, no build step, no frameworks. Progress is saved locally using `localStorage`, not a server.

### Example

```
quests/git-basics.html    <- your quest (one file, everything inside)
quests/git-basics.png     <- screenshot of your quest
```

---

## Before you start

1. Check [existing quests](../ReadMe.md) so you don't duplicate one
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
git checkout -b add/quest-name
```

### 3. Create your file

Use kebab-case, matching your quest's `id`:

```bash
touch quests/git-basics.html
```

### 4. Build your quest

Same starter conventions as tools: semantic HTML, CSS custom properties for theming, dark mode support, vanilla JS. Use `localStorage` to persist progress between visits — see `tools/code-snippet-manager.html` for a reference on local storage usage in this repo.

### 5. Register your quest in data/quests.json

Open `data/quests.json` and add an entry to the `"quests"` array:

```json
{
  "id": "git-basics",
  "name": "Git Basics",
  "shortDescription": "Learn the core Git workflow by making commits and branches interactively.",
  "longDescription": "## Git Basics\n\nAn interactive quest teaching the fundamental Git workflow.\n\n### Features\n\n- Step-by-step guided challenges\n- Progress saved locally",
  "category": "git",
  "tags": ["git", "beginner", "interactive"],
  "techStack": ["HTML5", "CSS3", "Vanilla JS", "LocalStorage API"],
  "difficulty": "Easy",
  "status": "live"
}
```

#### Field reference

Identical to `tools/Contributing.md`'s field reference — `id`, `name`, `shortDescription`, `longDescription`, `category`, `tags`, `techStack`, `difficulty`, `status` all mean the same thing here.

#### Valid category IDs

| ID | Display name |
|----|-------------|
| `git` | Git & Version Control |
| `css-fundamentals` | CSS Fundamentals |
| `js-fundamentals` | JavaScript Fundamentals |

If your quest doesn't fit an existing category, propose a new one in your issue first.

### 6. Add a screenshot

Same as tools: `quests/your-quest-name.png`, 1280x720 recommended, showing the quest mid-interaction, not an empty state.

### 7. Sort and normalize

```bash
node scripts/sort-norm.js data/quests.json
```

### 8. Build and verify

```bash
node scripts/build.js
open index.html
```

Click the Quests pillar and confirm your quest card appears correctly.

### 9. Test thoroughly

Same checklist as tools: Chrome + Firefox, mobile responsive, no console errors, keyboard accessible, edge cases handled — plus specifically verify your progress-tracking actually persists across a page reload.

### 10. Format, commit, push

```bash
npm run format
git add quests/your-quest-name.html quests/your-quest-name.png data/quests.json
git commit -m "Add: your-quest-name"
git push origin add/quest-name
```

Then open a Pull Request.

---

## Quest requirements

Same **Must have / Should have / Must not have** rules as `tools/Contributing.md`, with one addition:

- **Must persist progress** via `localStorage` so a learner doesn't lose their place on refresh
- **Must have a clear "start" and "complete" state** — the learner should always know where they are in the quest

---

## PR format

Same as tools: `Add: quest-name`, link the issue with `Closes #123`, include a screenshot, confirm the checklist.