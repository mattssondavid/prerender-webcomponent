import '@server/shim/shim-dom.ts';

export const parseHTMLFromString = (content: string): globalThis.Document => {
    const parser = new DOMParser();
    const document = parser.parseFromString(content, 'text/html');
    return document;
};
