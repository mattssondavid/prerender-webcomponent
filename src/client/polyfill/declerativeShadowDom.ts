/**
 * @see https://developer.chrome.com/articles/declarative-shadow-dom/
 */
function supportsDeclarativeShadowDOM(): boolean {
    return Object.hasOwn(
        globalThis.HTMLTemplateElement.prototype,
        'shadowRootMode'
    );
}

/**
 * @see https://developer.chrome.com/articles/declarative-shadow-dom/
 */
function attachShadowRoots(root: globalThis.Document): void {
    root.querySelectorAll('template[shadowrootmode]').forEach(
        (template): void => {
            if (!(template instanceof globalThis.HTMLTemplateElement)) return;
            const mode: globalThis.ShadowRootMode = (template.getAttribute(
                'shadowrootmode'
            ) || 'open') as globalThis.ShadowRootMode;
            let shadowRoot: globalThis.ShadowRoot | null = null;
            if (!template.parentElement?.shadowRoot) {
                // Only add template's shadow root if the element currently do
                // not have a shadow root
                shadowRoot = template.parentElement!.attachShadow({
                    mode,
                });
                shadowRoot.appendChild(template.content);
            }
            template.remove();
            if (shadowRoot) {
                attachShadowRoots(shadowRoot as unknown as Document);
            }
        }
    );
}

/**
 * @returns {void}
 */
export const polyfill = () => {
    if (!supportsDeclarativeShadowDOM()) attachShadowRoots(document);
};
