---
"corset": patch
---

Adds support for longhand properties for events

This adds the following longhand syntaxes for events:

```js
let controller = new AbortController();

sheet`
  button {
    event-listener[click]: ${cb};
    event-capture[click]: false;
    event-once[click]: false;
    event-passive[click]: false;
    event-signal[click]: ${controller.signal};
  }
`
```