import { parseHTMLFromString } from '@server/parseHTMLFromString.ts';

const isCustomElementTag = (element: Element): boolean => {
    const customTagPattern = /[a-z]+-[a-z]+/i;
    return customTagPattern.test(element.tagName);
};

export const renderToString = async (content: string): Promise<string> => {
    // Parse content
    if (content.length === 0) {
        return '';
    }
    const document = parseHTMLFromString(content);

    // Evaluate scripts nodes before appended to the DOM if they contain
    // reference to CustomElementRegistry
    const walker = document.createNodeIterator(
        document.body,
        NodeFilter.SHOW_ELEMENT
    );
    let currentNode: Node | null = null;
    while ((currentNode = walker.nextNode())) {
        // Dangerously evaluate scripts
        if (
            currentNode.nodeType === Node.ELEMENT_NODE &&
            currentNode.nodeName === 'SCRIPT'
        ) {
            const script = currentNode as Element;

            const type = script.getAttribute('type');
            const src = script.getAttribute('src');

            if (type === 'module') {
                let scriptContent: string = '';
                if (src) {
                    // We need to check if we want to import/evaluate this script
                    // so we need the script content for the evaluation
                    const headers = new Headers();
                    headers.append('Content-Type', 'text/javascript');
                    scriptContent = await (
                        await fetch(src, {
                            headers,
                        })
                    ).text();
                } else {
                    scriptContent = script.innerHTML;
                }

                // Only execute a script that contains a
                // CustomElementRegistry `define`-method call
                if (
                    !scriptContent
                        .toLowerCase()
                        .includes('customelements.define')
                ) {
                    continue;
                }

                const url = URL.createObjectURL(
                    new Blob([scriptContent], {
                        type: 'text/javascript',
                    })
                );
                await import(url);
                URL.revokeObjectURL(url);

                // Remove the script from the DOM and thus prevent it to be
                // part of the server-side rendered content
                script.remove();
            }
        }
    }

    Array.from(document.body.childNodes).forEach((currentNode: Node): void => {
        if (currentNode.nodeType !== Node.ELEMENT_NODE) {
            return;
        }
        const element = currentNode as Element;
        if (isCustomElementTag(element)) {
            let innerHTML: string = '';
            if (element.shadowRoot) {
                innerHTML = element.getHTML({ serializableShadowRoots: true });
            } else {
                // Failed to check if the web component is a Shadow Host.
                // Try to call the `connectedCallback` method of the web component
                // as a ShadowRoot might be added/inserted when the element is
                // added to the DOM
                const defintion = window.customElements.get(
                    element.tagName.toLowerCase()
                );

                if (defintion) {
                    const _element = new defintion();
                    // Trigger `connectedCallback()`
                    document.body.appendChild(_element); // Temporarily add to DOM

                    // Append all child nodes of the original element
                    element.childNodes.forEach((child): void => {
                        _element.appendChild(child.cloneNode());
                    });

                    if (_element.shadowRoot) {
                        innerHTML = _element.getHTML({
                            shadowRoots: [_element.shadowRoot],
                        });
                    } else {
                        innerHTML = _element.getHTML({
                            serializableShadowRoots: true,
                        });
                    }
                    _element.remove(); // Remove the temporary element from the DOM
                }

                // ToDo: If the element is mode=open but `serializable` is
                // undefined, set it to `true` and then run getHtml
                // if it is however set, use it strictly.
            }

            if (innerHTML) {
                element.innerHTML = innerHTML;
            }
        }
    });

    return (
        new XMLSerializer().serializeToString(document.doctype!) +
        document.documentElement.outerHTML
    );
};
