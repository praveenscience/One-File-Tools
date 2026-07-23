# Contributing an Instrument

Thank you for contributing to One File Instruments! This guide walks you through the process.

---

## What you're building

A **single, self-contained HTML file** that's a real, playable musical or audio tool — a synthesizer, drum machine, chord reference, tuner, ear trainer, etc. Everything — HTML, CSS, and JavaScript — lives in one file. No build step, no `npm install`, no JS frameworks. CDN links for lightweight libraries (e.g. Tone.js) and fonts are allowed to keep files slim.

### Example

```
instruments/step-sequencer.html <- your instrument (one file, everything inside)
instruments/step-sequencer.png <- screenshot of your instrument
```
---

## Before you start

1. Check the [Ideas Board](../ReadMe.md#ideas-board) for unclaimed ideas
2. Check existing instruments in `data/instruments.json` so you don't duplicate one
3. Open an [issue](https://github.com/praveenscience/One-File-Tools/issues) or comment on an existing one to claim it
4. **Wait for assignment** before starting
5. Look at any existing tool in `/tools` for coding-style patterns (same conventions apply here)

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
git checkout -b add/step-sequencer
```

### 3. Create your file

Use **kebab-case**:

```bash
touch instruments/step-sequencer.html
```

### 4. Build your instrument

Follow the same starter template and standards used in `/tools`:

- Modern JS (ES6+), `addEventListener` (no inline `onclick`)
- Real, working audio via the Web Audio API (or Tone.js via CDN) — not a visual mockup of sound
- Dark mode support, responsive layout, keyboard accessible
- Footer links back to One File Tools
- No `console.log`/`debugger` left in

### 5. Add your entry to `data/instruments.json`

Add a full object to the `instruments` array (same required fields as `tools.json`: `id`, `name`, `shortDescription`, `longDescription`, `category`, `tags`, `techStack`, `difficulty`, `status`).

### 6. Take a screenshot

Save as `instruments/[id].png` (1280x720 recommended).

### 7. Sort and validate

```bash
node scripts/sort-norm.js data/instruments.json
node scripts/build.js
```

> You do **not** need to edit `scripts/index-template.txt`, `index.html`, or the ReadMe table — these are auto-generated.

### 8. Test thoroughly

- [ ] Open directly in browser
- [ ] Test in Chrome and Firefox
- [ ] Test on mobile
- [ ] No console errors
- [ ] Audio actually plays (not just a visual)
- [ ] Keyboard navigation works

### 9. Format with Prettier

```bash
npx prettier --write instruments/your-instrument.html
```

### 10. Commit and push

```bash
git add instruments/your-instrument.html instruments/your-instrument.png data/instruments.json
git commit -m "Add: your-instrument-name"
git push origin add/your-instrument-name
```

---

## Existing categories

| Category | Example instruments |
|----------|---------------------|
| **Rhythm & Percussion** | Step Sequencer, Metronome, Drum Machine |
| **Melody & Synthesis** | Synth Keyboard, Note Frequency Generator |
| **Chords & Harmony** | Guitar Chord Library, Scale Finder |
| **Notation & Theory** | Ear Trainer, Interval Trainer |
| **Effects & Processing** | Instrument Tuner, Waveform Visualizer |

---

## Checklist before submitting

- [ ] Instrument is a single `.html` file in `instruments/`
- [ ] Filename is kebab-case and matches the `id` in `data/instruments.json`
- [ ] Screenshot saved as `instruments/[id].png`
- [ ] Entry added to `data/instruments.json` with all required fields
- [ ] Ran `node scripts/sort-norm.js data/instruments.json`
- [ ] Ran `node scripts/build.js` and verified it appears on the landing page
- [ ] Works in Chrome and Firefox, responsive, no console errors
- [ ] Real audio output, not a mockup
- [ ] Formatted with Prettier
- [ ] Dark mode support, footer link back, keyboard accessible