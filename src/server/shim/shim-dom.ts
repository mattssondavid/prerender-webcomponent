import { getHTML, GetHTMLOptions } from '@server/shim/shim-getHtml.ts';
import { JSDOM } from 'jsdom';

declare global {
    interface SerializableElement {
        getHTML: (options?: GetHTMLOptions) => string;
    }

    /*
     * Monkey patch ShadowRoot properties
     */
    interface SerializableShadowRoot {
        /**
         * `true` if the shadow root is clonable, and `false` otherwise
         *
         * @see https://developer.mozilla.org/en-US/docs/Web/API/ShadowRoot/clonable
         */
        readonly clonable: boolean;

        /**
         * `true` if the shadow root delegates focus, and `false` otherwise
         *
         * @see https://developer.mozilla.org/en-US/docs/Web/API/ShadowRoot/delegatesFocus
         */
        readonly delegatesFocus: boolean;

        /**
         * `true` if the shadow root is serializable, and `false` otherwise
         *
         * @see https://developer.mozilla.org/en-US/docs/Web/API/ShadowRoot/serializable
         */
        readonly serializable: boolean;
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

    /*
     * Patch/Polyfill `globalThis`
     */
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
        'DOMParser',
        'NodeFilter',
        'XMLSerializer',
    ];
    patchedDOMAPIs.forEach((domApi: string): void => {
        Reflect.set<typeof globalThis, string>(
            globalThis,
            domApi,
            window[domApi as keyof globalThis.Window]
        );
    });

    /**
     * Monkey Patch ShadowRoot.attachShadow from JSDOM while waiting for JSDOM
     * to fix their ShadowRoot implementation
     *
     * @see https://developer.mozilla.org/en-US/docs/Web/API/Element/attachShadow
     * @see https://github.com/jsdom/jsdom/
     */
    const originalAttachShadow = globalThis.Element.prototype.attachShadow;
    globalThis.Element.prototype.attachShadow = function (
        options: ShadowRootInit & { clonable?: boolean }
    ): ShadowRoot {
        const shadowRoot = originalAttachShadow.apply(this, [options]);

        /*
         * Set Web API specification defaults and then monkey patch based on the
         * provided ShadowRoot initialisation options
         */
        if (typeof shadowRoot.clonable === 'undefined') {
            (shadowRoot.clonable as boolean) = false;
        }
        if (typeof options.clonable === 'boolean') {
            (shadowRoot.clonable as boolean) = options.clonable;
        }

        if (typeof shadowRoot.delegatesFocus === 'undefined') {
            (shadowRoot.delegatesFocus as boolean) = false;
        }
        if (typeof options.delegatesFocus === 'boolean') {
            (shadowRoot.delegatesFocus as boolean) = options.delegatesFocus;
        }

        if (typeof shadowRoot.serializable === 'undefined') {
            (shadowRoot.serializable as boolean) = false;
        }
        if (typeof options.serializable === 'boolean') {
            (shadowRoot.serializable as boolean) = options.serializable;
        }

        return shadowRoot;
    };

    /*
     * Polyfill `getHTML`
     */
    globalThis.Element.prototype.getHTML ??= function (
        options?: GetHTMLOptions
    ): string {
        return getHTML(this, options);
    };
    globalThis.ShadowRoot.prototype.getHTML ??=
        globalThis.Element.prototype.getHTML; // Defined above
};
patchGlobalThis();
