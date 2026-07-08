# Contributing a Quiz

Thank you for contributing a quiz to One File Tools! Quizzes are focused, multiple-choice challenges — think quick knowledge checks, not full gamified adventures. This guide mirrors the [tools Contributing guide](../tools/Contributing.md), adjusted for quizzes.

---

## Quizzes vs Quests — what's the difference?

| | Quiz | Quest |
|---|---|---|
| **Format** | Multiple-choice / short-answer levels | Rich, gamified interactive experience |
| **Length** | 6–10 levels, ~150–300 lines | 10+ levels, 500+ lines with custom gameplay |
| **Complexity** | Cookie-cutter template, straightforward | Unique mechanics, themes, illustrations |
| **Example** | CSS Grid Quiz, Event Loop Arena | Git Bisect Detective, Regex Golf |

If your idea involves custom gameplay mechanics, narrative theming, or goes beyond pick-the-right-answer, it belongs in `quests/` instead.

---

## What you're building

A **single, self-contained HTML file** with a series of multiple-choice or short-answer levels testing knowledge of a specific topic. Same rules as tools: everything in one file, no build step, no frameworks. Progress is saved locally using `localStorage`.

### Example

```
quizzes/css-grid-quest.html    <- your quiz (one file, everything inside)
quizzes/css-grid-quest.png     <- screenshot of your quiz
```

---

## Before you start

1. Check [existing quizzes](../ReadMe.md) so you don't duplicate one
2. Open an [issue](https://github.com/praveenscience/One-File-Tools/issues) or comment on an existing one to claim it
3. **Wait for assignment** before starting
4. Look at existing quizzes in `quizzes/` for the coding conventions this repo follows

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
git checkout -b add/quiz-name
```

### 3. Create your file

Use kebab-case, matching your quiz's `id`:

```bash
touch quizzes/css-basics-quiz.html
```

### 4. Build your quiz

Same starter conventions as tools: semantic HTML, CSS custom properties for theming, dark mode support, vanilla JS. Use `localStorage` to persist progress between visits. Look at existing quizzes like `quizzes/css-grid-quest.html` for reference.

### 5. Register your quiz in data/quizzes.json

Open `data/quizzes.json` and add an entry to the `"quizzes"` array:

```json
{
  "id": "css-basics-quiz",
  "name": "CSS Basics Quiz",
  "shortDescription": "Test your CSS knowledge with 8 multiple-choice challenges.",
  "longDescription": "## CSS Basics Quiz\n\nA quick quiz covering core CSS concepts.\n\n### Features\n\n- 8 multiple-choice levels\n- Progress saved locally",
  "category": "css-fundamentals",
  "tags": ["css", "quiz", "learning"],
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

If your quiz doesn't fit an existing category, propose a new one in your issue first.

### 6. Add a screenshot

Same as tools: `quizzes/your-quiz-name.png`, 1280x720 recommended, showing the quiz mid-interaction, not an empty state.

### 7. Sort and normalize

```bash
node scripts/sort-norm.js data/quizzes.json
```

### 8. Build and verify

```bash
node scripts/build.js
open index.html
```

Click the Quizzes pillar and confirm your quiz card appears correctly.

### 9. Test thoroughly

Same checklist as tools: Chrome + Firefox, mobile responsive, no console errors, keyboard accessible, edge cases handled — plus specifically verify your progress-tracking actually persists across a page reload.

### 10. Format, commit, push

```bash
npm run format
git add quizzes/your-quiz-name.html quizzes/your-quiz-name.png data/quizzes.json
git commit -m "Add: your-quiz-name"
git push origin add/quiz-name
```

Then open a Pull Request.

---

## Quiz requirements

Same **Must have / Should have / Must not have** rules as `tools/Contributing.md`, with these additions:

- **Must persist progress** via `localStorage` so a learner doesn't lose their place on refresh
- **Must have a clear "start" and "complete" state** — the learner should always know where they are
- **Must have at least 6 levels/questions** — fewer than that isn't worth a standalone file

---

## PR format

Same as tools: `Add: quiz-name`, link the issue with `Closes #123`, include a screenshot, confirm the checklist.
