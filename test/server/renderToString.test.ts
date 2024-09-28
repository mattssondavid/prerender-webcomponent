import { assertEquals } from '@std/assert';
import { describe, it } from '@std/testing/bdd';
import { html } from '@util/template/html.ts';
import { renderToString } from '@server/renderToString.ts';

const scriptContent = html`<script type="module">
    class SimonSays extends HTMLElement {
        constructor() {
            super();
        }

        connectedCallback() {
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
</script>`;

describe('renderToString', (): void => {
    it('can convert a web component to declerative shadow dom form', async (): Promise<void> => {
        const htmlContent = html`<!DOCTYPE html>
            <html>
                <head></head>
                <body>
                    <simon-says></simon-says>
                    ${scriptContent}
                </body>
            </html>`;

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

    it('can convert a web component to declerative shadow dom form with child value', async (): Promise<void> => {
        const htmlContent = html`<!DOCTYPE html>
            <html>
                <head></head>
                <body>
                    <simon-says>What?</simon-says>
                    ${scriptContent}
                </body>
            </html>`;

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
                                <p>Simon says <slot></slot></p> \
                        </template> \
                        What? \
                    </simon-says> \
                </body> \
            </html>`
            .replaceAll(/\s{2,}/g, ' ')
            .replaceAll(' >', '>')
            .replaceAll('> <', '><')
            .trim();
        assertEquals(actual, expected);
    });

    it('can convert a web component to declerative shadow dom form when component is defined over src module', async (): Promise<void> => {
        const newScriptContent = scriptContent
            .replace('<script type="module">', '')
            .replace('</script>', '');
        const url = URL.createObjectURL(
            new Blob([newScriptContent], {
                type: 'text/javascript',
            })
        );

        const htmlContent = html`<!DOCTYPE html>
            <html>
                <head></head>
                <body>
                    <simon-says></simon-says>
                    <script
                        type="module"
                        src="${url}"
                    ></script>
                </body>
            </html>`;

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

        URL.revokeObjectURL(url); // Garbage collect the URL object

        assertEquals(actual, expected);
    });
});
