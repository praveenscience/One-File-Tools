export function fuzzyMatch(query, text) {
    if (!query) return true;

    query = query.toLowerCase();
    text = text.toLowerCase();

    let j = 0;

    for (let i = 0; i < text.length; i++) {
        if (text[i] === query[j]) {
            j++;
        }
    }

    return j === query.length;
}
