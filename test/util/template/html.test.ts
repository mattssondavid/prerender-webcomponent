import { assertEquals } from '@std/assert';
import { describe, it } from '@std/testing/bdd';
import { html } from '@util/template/html.ts';

describe('html tagged template literal', (): void => {
    it('can return valid html', (): void => {
        const actual = html`<p>hi</p>`;
        const expected = '<p>hi</p>';

        assertEquals(actual, expected);
    });

    it('can return valid html with expression', (): void => {
        const expression = 'world';

        const actual = html`<p>Hello ${expression}</p>`;
        const expected = '<p>Hello world</p>';

        assertEquals(actual, expected);
    });

    it('can return valid html with multiple expressions', (): void => {
        const article = 'brown';
        const subject = 'fox';
        const verb = 'jumped';

        const actual = html`The ${article} ${subject} ${verb}.`;
        const expected = 'The brown fox jumped.'; // TextContent

        assertEquals(actual, expected);
    });
});
