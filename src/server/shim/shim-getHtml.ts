import '@server/shim/shim-dom.ts';
import { html } from '@util/template/html.ts';

export type GetHTMLOptions = {
    readonly serializableShadowRoots?: boolean;
    readonly shadowRoots?: globalThis.ShadowRoot[];
};

/**
 * Serialize the DOM node to a HTML string.
 *
 * __Note__: This algorithm serializes the children of the node being serialized, not the node itself.
 *
 * @param {globalThis.Node} node The node to serialize, where `node` is expected to be either an `Element`, `ShadowRoot` or a `DocumentFragment`
 * @param {{serializableShadowRoots: boolean, shadowRoots: globalThis.ShadowRoot[]}} options Options
 * @returns {string} A string that represents the HTML serialization of the node
 * @throws None
 *
 * @see https://developer.mozilla.org/en-US/docs/Web/API/Element/getHTML#serializableshadowroots
 * @see https://html.spec.whatwg.org/multipage/parsing.html#serialising-html-fragments
 */
export const getHTML = (
    node: Node,
    options?: GetHTMLOptions | undefined
): string => {
    if (node instanceof globalThis.HTMLTemplateElement) {
        node = node.content; // DocumentFragment
    }
    let serializeResult = '';

    // Check if node serialises as void...
    const voidElements = [
        'area',
        'base',
        'br',
        'col',
        'embed',
        'hr',
        'img',
        'input',
        'link',
        'meta',
        'source',
        'track',
        'wbr',
        'basefont',
        'bgsound',
        'frame',
        'keygen',
        'param',
    ];
    if (voidElements.includes(node.nodeName.toLowerCase())) {
        return '';
    }

    if (node.nodeType === globalThis.Node.ELEMENT_NODE) {
        if ((node as Element).shadowRoot !== null) {
            // `node` is a Shadow Host
            const shadow = (node as Element).shadowRoot!;

            if (
                (options?.serializableShadowRoots === true &&
                    shadow.serializable === true) ||
                options?.shadowRoots?.includes(shadow)
            ) {
                const template = html`<template
                    shadowrootmode="${shadow.mode}"
                    ${shadow.delegatesFocus
                        ? 'shadowrootdelegatesfocus=""'
                        : ''}
                    ${shadow.serializable ? 'shadowrootserializable=""' : ''}
                    ${shadow.clonable ? 'shadowrootclonable=""' : ''}
                    >${getHTML(shadow, options)}</template
                >`;

                serializeResult += template;
            }
        }
    }

    const fragments = Array.from(node.childNodes).map(
        (currentNode: Node): string => {
            switch (currentNode.nodeType) {
                case globalThis.Node.ELEMENT_NODE: {
                    const element = currentNode as Element;

                    let s = `<${element.tagName.toLowerCase()}`;
                    if (element.hasAttributes()) {
                        s += [...new Set(element.getAttributeNames())]
                            .map(
                                (name): string =>
                                    ` ${name}="${element.getAttribute(name)}"`
                            )
                            .join('');
                    }
                    s += '>';
                    s += getHTML(currentNode, options);
                    s += `</${element.tagName.toLowerCase()}>`;

                    return s;
                }
                case globalThis.Node.TEXT_NODE: {
                    const parentNode = currentNode.parentNode;
                    if (parentNode?.nodeType === globalThis.Node.ELEMENT_NODE) {
                        const parentElment = currentNode.parentElement!;
                        if (
                            [
                                'style',
                                'script',
                                'xmp',
                                'iframe',
                                'noembed',
                                'noframes',
                                'plaintext',
                                'noscript',
                            ].includes(parentElment.nodeName.toLowerCase())
                        ) {
                            return currentNode.nodeValue ?? ''; // Raw data
                        }
                    }
                    return currentNode.nodeValue ?? ''; // ToDo sanitise this
                }
                case globalThis.Node.COMMENT_NODE: {
                    return `<!--${currentNode.nodeValue}-->`;
                }
                case globalThis.Node.PROCESSING_INSTRUCTION_NODE: {
                    throw new TypeError(
                        'ProcessingInstruction node is not implemented'
                    );
                }
                case globalThis.Node.DOCUMENT_TYPE_NODE: {
                    throw new TypeError('DocumentType node is not implemented');
                }
                default: {
                    return '';
                }
            }
        }
    );

    serializeResult += fragments.join('');

    return serializeResult;
};
