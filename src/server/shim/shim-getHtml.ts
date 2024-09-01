import { html } from '@util/template/html.ts';
import '@server/shim/shim-dom.ts';

type GetHTMLOptions = {
    readonly serializableShadowRoots?: boolean;
    readonly shadowRoots?: globalThis.ShadowRoot[];
};

/**
 * Serialize the DOM node to a HTML string.
 *
 * __Note__: This algorithm serializes the children of the node being serialized, not the node itself.
 *
 * @param {globalThis.Node} node The node to serialize
 * @param {{serializableShadowRoots: boolean, shadowRoots: globalThis.ShadowRoot[]}} options Options
 * @returns {string} A string that represents the HTML serialization of the node
 * @throws None
 *
 * @see https://developer.mozilla.org/en-US/docs/Web/API/Element/getHTML#serializableshadowroots
 * @see https://html.spec.whatwg.org/multipage/parsing.html#serialising-html-fragments
 */
export const getHTML = (
    node: Node,
    // | globalThis.Element
    // | globalThis.ShadowRoot
    // | globalThis.DocumentFragment,
    // opts: Record<string, boolean | string[]>
    options?: GetHTMLOptions | undefined
): string => {
    if (node instanceof globalThis.HTMLTemplateElement) {
        node = node.content; // DocumentFragment
    }

    console.log('-= Details =-');
    console.log('Node');
    console.log(`\tNode name: ${node.nodeName}`);
    console.log(`\tNode Type: ${node.nodeType}`);
    console.log(`\tNode Value: ${node.nodeValue}`);

    console.log('Options');
    console.log(
        `\tserializableShadowRoots: ${options?.serializableShadowRoots}`
    );
    console.log(`\tshadowRoots: ${options?.shadowRoots}`);

    console.log(
        `Node instance: ${
            node instanceof Object && Object(node).constructor.name
        }`
    );

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
            console.log('Shadow node');
            console.log(`\tShadow Host: ${(node as Element).outerHTML}`);

            const shadow = (node as Element).shadowRoot!;
            console.log(`\tShadow Root: ${shadow}`);

            // Temporary patches if not properly defined
            if (typeof shadow.clonable === 'undefined') {
                (shadow.clonable as boolean) = false;
            }
            if (typeof shadow.delegatesFocus === 'undefined') {
                (shadow.delegatesFocus as boolean) = false;
            }
            if (typeof shadow.mode === 'undefined') {
                (shadow.mode as globalThis.ShadowRootMode) = 'open';
            }
            if (typeof shadow.serializable === 'undefined') {
                (shadow.serializable as boolean) = true;
            }

            if (
                (options?.serializableShadowRoots === true &&
                    shadow.serializable === true) ||
                options?.shadowRoots?.includes(shadow)
            ) {
                console.log(`\tShadow Root details`);
                console.log(`\t\tmode: ${shadow.mode}`);
                console.log(`\t\tclonable: ${shadow.clonable}`);
                console.log(`\t\tdelegatesFocus: ${shadow.delegatesFocus}`);
                console.log(`\t\tserializable: ${shadow.serializable}`);
                const children = Array.from(shadow.childNodes.values()).map(
                    (node): string => `${node.nodeType} – ${node.nodeName}`
                );
                console.log(`\t\tchildren: ${children.join(',')}`);

                const template = html`<template
                    shadowrootmode="${shadow.mode}"
                    ${shadow.delegatesFocus
                        ? 'shadowrootdelegatesfocus=""'
                        : ''}
                    ${shadow.serializable ? 'shadowrootserializable=""' : ''}
                    ${shadow.clonable ? 'shadowrootclonable=""' : ''}
                    >${getHTML(shadow, options)}</template
                >`
                    .replaceAll(/\s{2,}/g, ' ')
                    .replaceAll(/\s{1,}(?=[<>])/g, '');

                serializeResult += template;
            }
        }
    }

    const fragments = Array.from(node.childNodes).map(
        (currentNode: Node): string => {
            console.log(`Child node`);
            console.log(`\tNode name: ${currentNode.nodeName}`);
            console.log(`\tNode Type: ${currentNode.nodeType}`);
            console.log(`\tNode Value: ${currentNode.nodeValue}`);
            const children = [...currentNode.childNodes.values()]
                .map((node): string => `${node.nodeType} – ${node.nodeName}`)
                .join(',');
            console.log(`\tNode Children: ${children}`);

            switch (currentNode.nodeType) {
                case globalThis.Node.ELEMENT_NODE: {
                    // Handle element by replacing the content between the START TAG
                    // and END TAG, e.g. from `<p>hi</p>` replaces "hi"
                    return (currentNode as Element).outerHTML.replace(
                        /(?<=>)([\w\s]+)(?=<\/)/,
                        getHTML(currentNode, options)
                    );
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
    console.log(`fragments: ${fragments}`);
    serializeResult += fragments.join('');

    // TMP
    const walker = document.createTreeWalker(
        node,
        globalThis.NodeFilter.SHOW_ALL,
        {
            acceptNode: (currentNode) =>
                currentNode === node || currentNode instanceof SVGElement
                    ? NodeFilter.FILTER_SKIP
                    : NodeFilter.FILTER_ACCEPT,
        }
    );
    let currentNode: Node | null = null;
    while ((currentNode = walker.nextNode())) {
        console.log('Walker');
        console.log('Current Node');
        console.log(`\tNode name: ${currentNode.nodeName}`);
        console.log(`\tNode Type: ${currentNode.nodeType}`);
        console.log(`\tNode Value: ${currentNode.nodeValue}`);
        const children = [...currentNode.childNodes.values()]
            .map((node): string => `${node.nodeType} – ${node.nodeName}`)
            .join(',');
        console.log(`\tNode Children: ${children}`);
    }
    // EOF TEMP

    console.log(`RESULT: ${serializeResult}`);

    return serializeResult;
};
