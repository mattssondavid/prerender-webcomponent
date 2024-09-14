import '@server/shim/shim-dom.ts';
import { assertEquals } from '@std/assert';
import { afterEach, beforeAll, describe, it } from '@std/testing/bdd';

describe('DOM shim', (): void => {
    describe('polyfilled getHTML', (): void => {
        beforeAll((): void => {
            class SimonSays extends HTMLElement {
                constructor() {
                    super();
                }

                connectedCallback(): void {
                    if (!this.shadowRoot) {
                        const template = document.createElement('template');
                        template.innerHTML = '<p>Simon says <slot></slot></p>';

                        this.attachShadow({
                            mode: 'open',
                            serializable: true,
                        }).appendChild(template.content.cloneNode(true));
                    }
                }
            }
            if (!customElements.get('simon-says')) {
                customElements.define('simon-says', SimonSays);
            }
        });
        afterEach((): void => {
            document.body.replaceChildren();
        });

        it('Polyfilled getHTML()', (): void => {
            const element = document.createElement('simon-says');
            document.body.appendChild(element);

            const actual = element.getHTML();
            const expected = '';

            assertEquals(actual, expected);
        });

        it('Polyfilled getHTML({ serializableShadowRoots: true })', (): void => {
            const element = document.createElement('simon-says');
            document.body.appendChild(element);

            const actual = element.getHTML({ serializableShadowRoots: true });
            const expected =
                '<template shadowrootmode="open" shadowrootserializable=""><p>Simon says <slot></slot></p></template>';

            assertEquals(actual, expected);
        });

        it('Polyfilled getHTML({ shadowRoots: [element.shadowRoot] })', (): void => {
            const element = document.createElement('simon-says');
            document.body.appendChild(element);

            const actual = element.getHTML({
                shadowRoots: [element.shadowRoot!],
            });
            const expected =
                '<template shadowrootmode="open" shadowrootserializable=""><p>Simon says <slot></slot></p></template>';

            assertEquals(actual, expected);
        });
    });
});
