import { fuzzyMatch } from "./fuzzy.js";

export function filterCommands(commands, query) {
    return commands.filter(cmd =>
        fuzzyMatch(query, cmd.title) ||
        fuzzyMatch(query, cmd.description)
    );
}
