/**
 * A tagged template literal for HTML (string) content.
 *
 * @param {string[]} strings The string values in the template literal making up the content
 * @param {unknown[]} substitutions Expressions to substitute for the content output
 * @returns {string} HTML content with substituted expressions
 */
export const html = (
    strings: TemplateStringsArray,
    ...substitutions: unknown[]
): string => {
    return strings.reduce((accumulator, current, index): string => {
        const substitution = substitutions[index] ?? '';
        // Strip away `\n`
        const strippedCurrent = current
            .replace(/\n\s{2,}/g, ' ')
            .replaceAll(/\s{1,}(?=[<>])/g, '')
            .replaceAll(/>\s{1,}/g, '>');
        return accumulator.trimEnd() + strippedCurrent + String(substitution);
    }, '');
};
