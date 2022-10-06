---
"corset": minor
---

Allow specifying an alternative event target with event-target

This now allows specifying an alternative event target via the new `event-target` property. You can use it like this:

```js
import sheet, { mount } from 'https://cdn.corset.dev/v2';

mount(document, class {
  onpopstate(ev) {
    console.log(`location: ${document.location}, state: ${JSON.stringify(event.state)}`);
  }
  bind() {
    return sheet`
      #app {
        event: popstate ${this.onpopstate};
        event-target: popstate ${window};
      }
    `;
  }
});
```

In the above we are able to use a selector to listen to the [popstate](https://developer.mozilla.org/en-US/docs/Web/API/Window/popstate_event) event that is on the window object.

This can also be used with any object that follows the [EventTarget](https://developer.mozilla.org/en-US/docs/Web/API/EventTarget) interface:

```js
import sheet, { mount } from 'https://cdn.corset.dev/v2';

let target = new EventTarget();
// Now this can be shared around

mount(document, class {
  bind() {
    return sheet`
      #app {
        event: foo ${() => console.log('foo event occurred!')};
        event-target: foo ${target};
      }

      some-custom-element {
        prop: events ${target};
      }
    `;
  }
});
```