# Prerender Web Component

_Convert Web Component to Declarative Shadow DOM (DSD)._

## Features

-   Convert defined Web Component to Declarative Shadow DOM (DSD).

## Description

One approach to [server-side render (SSG) Web Component](https://web.dev/articles/declarative-shadow-dom) is to convert the Web Component (Custom HTMLElement) to its Declarative Shadow DOM (DSD) version if it is using a [Shadow DOM](https://developer.mozilla.org/en-US/docs/Web/API/Web_components/Using_shadow_DOM), as without DSD only the element's current HTML can be prerendered.

There are several approaches to accomplish this; one is to use the Browsers' built-in Element [`getHTML` method](https://developer.mozilla.org/en-US/docs/Web/API/Element/getHTML#serializableshadowroots) which is part of the Web API specification of [serialising HTML fragments](https://html.spec.whatwg.org/multipage/parsing.html#serialising-html-fragments).

## Usage

Transform the HTML via `renderToString` where each Node is run through a polyfilled getHTML-method.
