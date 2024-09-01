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
    const content = strings
        .map((string): string => string)
        .reduce((accumulator, current, index): string => {
            const substitution = substitutions[index];
            return (accumulator +=
                typeof substitution !== 'undefined'
                    ? current + String(substitution)
                    : current);
        }, '');

    return content;
};
