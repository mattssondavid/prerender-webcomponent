import '@server/shim/shim-dom.ts';
import { getHTML } from '@server/shim/shim-getHtml.ts';
import { assertEquals } from '@std/assert';
import { afterEach, beforeAll, describe, it } from '@std/testing/bdd';

class OpenElement extends HTMLElement {
    constructor() {
        super();
    }

    connectedCallback(): void {
        if (!this.shadowRoot) {
            const template = document.createElement('template');
            template.innerHTML = `<slot></slot>`;

            this.attachShadow({ mode: 'open' }).appendChild(
                template.content.cloneNode(true)
            );
        }
    }
}

class ClosedElement extends HTMLElement {
    constructor() {
        super();
    }

    connectedCallback(): void {
        if (!this.shadowRoot) {
            const template = document.createElement('template');
            template.innerHTML = `<slot></slot>`;

            this.attachShadow({ mode: 'closed' }).appendChild(
                template.content.cloneNode(true)
            );
        }
    }
}

class SerializableElement extends HTMLElement {
    constructor() {
        super();
    }

    connectedCallback(): void {
        if (!this.shadowRoot) {
            const template = document.createElement('template');
            template.innerHTML = `<slot></slot>`;

            this.attachShadow({ mode: 'open', serializable: true }).appendChild(
                template.content.cloneNode(true)
            );
        }
    }
}

class DelegatesFocusElement extends HTMLElement {
    constructor() {
        super();
    }

    connectedCallback(): void {
        if (!this.shadowRoot) {
            const template = document.createElement('template');
            template.innerHTML = `<slot></slot>`;

            this.attachShadow({
                mode: 'open',
                delegatesFocus: true,
            }).appendChild(template.content.cloneNode(true));
        }
    }
}

describe('getHTML', (): void => {
    beforeAll((): void => {
        window.customElements.define('open-element', OpenElement);
        window.customElements.define('closed-element', ClosedElement);
        window.customElements.define(
            'serializable-element',
            SerializableElement
        );
        window.customElements.define(
            'delegates-focus-element',
            DelegatesFocusElement
        );
    });

    afterEach((): void => {
        document.body.replaceChildren(); // Clear body from element children
    });

    it('serialises simple element (p)', (): void => {
        const p = document.createElement('p');
        p.textContent = 'Hello there';

        const actual = getHTML(p);
        const expected = `Hello there`;

        assertEquals(actual, expected);
    });

    it('serialises simple nestled div with child (div > p)', (): void => {
        const p = document.createElement('p');
        p.textContent = 'Hello there';
        const div = document.createElement('div');
        div.appendChild(p);

        const actual = getHTML(div);
        const expected = `<p>Hello there</p>`;

        assertEquals(actual, expected);
    });

    it('serialises simple nestled div with child (div > p) where div has attributes', (): void => {
        const p = document.createElement('p');
        p.textContent = 'Hello there';
        const div = document.createElement('div');
        div.setAttribute('id', 'foo');
        div.classList.add('bar');
        div.appendChild(p);

        const actual = getHTML(div);
        const expected = `<p>Hello there</p>`;

        assertEquals(actual, expected);
    });

    it('serialises simple nestled div with child (div > p) where div and p have attributes', (): void => {
        const p = document.createElement('p');
        p.setAttribute('id', 'p-id');
        p.classList.add('p-class');
        p.textContent = 'Hello there';
        const div = document.createElement('div');
        div.setAttribute('id', 'div-id');
        div.classList.add('div-class');
        div.appendChild(p);

        const actual = getHTML(div);
        // Note. If DOM is parsed via `Linkedom` there is a bug where the
        // element `setAttribute` call order is ignored causing element
        // attributes to be added in reverse order (i.e. class="..." id="...")
        // as such, `JSDOM` is prefered over `Linkedom` to add DOM support.
        const expected = `<p id="p-id" class="p-class">Hello there</p>`;

        assertEquals(actual, expected);
    });

    it('serialises custom element without options', (): void => {
        const element = document.createElement('open-element');
        const p = document.createElement('p');
        p.textContent = 'Hello there';
        element.appendChild(p);
        document.body.appendChild(element); // Trigger CustomElement's `connectedCallback()`

        const actual = getHTML(element);
        const expected = '<p>Hello there</p>';

        assertEquals(actual, expected);
    });

    it('serialises custom element with closed element shadowRoot with option serializableShadowRoots', (): void => {
        const element = document.createElement('closed-element');
        const p = document.createElement('p');
        p.textContent = 'Hello there';
        element.appendChild(p);
        document.body.appendChild(element);

        const actual = getHTML(element, { serializableShadowRoots: true });
        const expected = '<p>Hello there</p>';

        assertEquals(actual, expected);
    });

    it('serialises custom element with open element shadowRoot with option serializableShadowRoots', (): void => {
        const element = document.createElement('serializable-element');
        const p = document.createElement('p');
        p.textContent = 'Hello there';
        element.appendChild(p);
        document.body.appendChild(element);

        const actual = getHTML(element, { serializableShadowRoots: true });
        const expected = `<template shadowrootmode="open"\
        shadowrootserializable=""><slot></slot></template><p>Hello there</p>`.replaceAll(
            /\s{2,}/g,
            ' '
        );

        assertEquals(actual, expected);
    });

    it('serialises custom element with delegate focus with option serializableShadowRoots', (): void => {
        const element = document.createElement('delegates-focus-element');
        const p = document.createElement('p');
        p.textContent = 'Hello there';
        element.appendChild(p);
        document.body.appendChild(element);

        const actual = getHTML(element, { serializableShadowRoots: true });
        // ToDo: In the future when JSDOM supports `ShadowRoot.delegatesFocus`
        // update the expected value to include `shadowrootdelegatesfocus=""`
        const expected = `<template shadowrootmode="open"\
        shadowrootserializable=""><slot></slot></template><p>Hello there</p>`.replaceAll(
            /\s{2,}/g,
            ' '
        );

        assertEquals(actual, expected);
    });

    it('serialises custom element with specified open ShadowRoot with option shadowRoots', (): void => {
        const element = document.createElement('serializable-element');
        const p = document.createElement('p');
        p.textContent = 'Hello there';
        element.appendChild(p);
        document.body.appendChild(element);

        const actual = getHTML(element, { shadowRoots: [element.shadowRoot!] });
        const expected = `<template shadowrootmode="open"\
        shadowrootserializable=""><slot></slot></template><p>Hello there</p>`.replaceAll(
            /\s{2,}/g,
            ' '
        );

        assertEquals(actual, expected);
    });

    it('serialises custom element once with open element ShadowRoot and same ShadowRoot specified with option serializableShadowRoots and shadowRoots', (): void => {
        const element = document.createElement('serializable-element');
        const p = document.createElement('p');
        p.textContent = 'Hello there';
        element.appendChild(p);
        document.body.appendChild(element);

        const actual = getHTML(element, {
            serializableShadowRoots: true,
            shadowRoots: [element.shadowRoot!],
        });
        const expected = `<template shadowrootmode="open"\
        shadowrootserializable=""><slot></slot></template><p>Hello there</p>`.replaceAll(
            /\s{2,}/g,
            ' '
        );

        assertEquals(actual, expected);
    });

    it('serialises custom element with specified closed ShadowRoot with option shadowRoots', (): void => {
        const element = document.createElement('closed-element');
        const p = document.createElement('p');
        p.textContent = 'Hello there';
        element.appendChild(p);
        document.body.appendChild(element);

        const actual = getHTML(element, { shadowRoots: [element.shadowRoot!] });
        const expected = '<p>Hello there</p>';

        assertEquals(actual, expected);
    });

    it('serialises nestled custom elements with open ShadowRoots with option serializableShadowRoots', (): void => {
        const outerElement = document.createElement('serializable-element');
        const innerElement = document.createElement('serializable-element');
        const p = document.createElement('p');
        p.textContent = 'Hello there';
        innerElement.appendChild(p);
        outerElement.appendChild(innerElement);
        document.body.appendChild(outerElement);

        const actual = getHTML(outerElement, { serializableShadowRoots: true });
        const expected = `\
        <template \
            shadowrootmode="open" \
            shadowrootserializable="" \
        ><slot></slot> \
        </template> \
        <serializable-element> \
            <template \
                shadowrootmode="open" \
                shadowrootserializable="" \
            ><slot></slot> \
            </template> \
            <p>Hello there</p> \
        </serializable-element> \
        `
            .replaceAll(/\s{2,}/g, ' ')
            .replaceAll(' >', '>')
            .replaceAll('> <', '><')
            .trim();

        assertEquals(actual, expected);
    });
});
