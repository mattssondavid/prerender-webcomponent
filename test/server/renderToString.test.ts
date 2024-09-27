import { assertEquals } from '@std/assert';
import { describe, it } from '@std/testing/bdd';
import { html } from '@util/template/html.ts';
import { renderToString } from '@server/renderToString.ts';

const htmlContent = html`
    <!DOCTYPE html>
    <html>
        <head> </head>
        <body>
            <simon-says></simon-says>
            <script type="module">
                class SimonSays extends HTMLElement {
                    constructor() {
                        super();
                    }

                    connectedCallback() {
                        if (!this.shadowRoot) {
                            const template = document.createElement('template');
                            template.innerHTML =
                                '<p>Simon says <slot></slot></p>';

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
            </script>
        </body>
    </html>
`;

describe('renderToString', (): void => {
    it('can convert a web component to declerative shadow dom form', async (): Promise<void> => {
        const actual = await renderToString(htmlContent);
        const expected = `
            <!DOCTYPE html> \
            <html> \
                <head></head> \
                <body> \
                    <simon-says> \
                        <template \
                            shadowrootmode="open" \
                            shadowrootserializable=""> \
                            <p>Simon says <slot></slot></p \
                        ></template> \
                    </simon-says> \
                </body> \
            </html>`
            .replaceAll(/\s{2,}/g, ' ')
            .replaceAll(' >', '>')
            .replaceAll('> <', '><')
            .trim();
        assertEquals(actual, expected);
    });
});
