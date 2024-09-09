import { getHTML } from '@server/shim/shim-getHtml.ts';
import { JSDOM } from 'jsdom';

declare global {
    interface SerializableElement {
        getHTML: typeof getHTML;
    }

    interface SerializableShadowRoot {
        serializable: boolean;
    }

    interface Element extends SerializableElement {}

    interface ShadowRoot extends SerializableElement, SerializableShadowRoot {}
}

/**
 * Patch the `globalThis` variable
 */
const patchGlobalThis = (): void => {
    const baseHTML = `<!DOCTYPE html><html><head></head><body></body></html>`;
    const { window } = new JSDOM(baseHTML, { pretendToBeVisual: true });

    const patchedDOMAPIs = [
        'document',
        'customElements',
        'window',
        'DocumentFragment',
        'Element',
        'HTMLElement',
        'HTMLTemplateElement',
        'Node',
        'ShadowRoot',
    ];
    // Patch/Polyfill `globalThis`
    patchedDOMAPIs.forEach((domApi: string): void => {
        Reflect.set<typeof globalThis, string>(
            globalThis,
            domApi,
            window[domApi as keyof globalThis.Window]
        );
    });

    // Polyfill `getHTML`
    globalThis.Element.prototype.getHTML ??= getHTML;
    globalThis.ShadowRoot.prototype.getHTML ??= getHTML;
};
patchGlobalThis();
