## What does this PR do?

<!-- A clear summary of your changes. Link the related issue with "Closes #123". -->

Closes #

## Type of Change

<!-- Check the one that applies. -->

- [ ] New tool
- [ ] Enhancement to existing tool
- [ ] Bug fix
- [ ] Documentation update
- [ ] Build system / infrastructure

## Screenshot

<!-- Required for new tools and UI changes. Drag and drop an image here. -->

## Checklist

<!-- Check all that apply before requesting review. -->

- [ ] I have read the [Contributing Guide](https://github.com/praveenscience/One-File-Tools/blob/main/Contributing.md)
- [ ] My branch follows the naming convention (`add/tool-name`, `feat/description`, or `fix/description`)
- [ ] I have tested my changes locally in at least one modern browser

### For new tools:

- [ ] The tool is a single self-contained `.html` file in the `tools/` folder
- [ ] The filename is kebab-case (e.g. `json-formatter.html`)
- [ ] I added an entry to `tools.json` with all required fields
- [ ] I added a screenshot as `tools/<tool-name>.png` next to the HTML file
- [ ] The tool works offline (no external API calls required for core functionality)
- [ ] No external JS/CSS frameworks or CDN imports (Google Fonts are okay)
- [ ] I ran `node sort-norm.js tools.json` to sort and normalize the tools registry
- [ ] I ran `node build.js` and verified the landing page renders correctly

### For enhancements / bug fixes:

- [ ] I have not introduced any external dependencies
- [ ] The tool still works as a standalone single HTML file
