---
"corset": minor
---

Consolidate data properties

This consolidates data attributes, grouping them by type, so that you might have:

```html
<div data-corset-props="--one --two --three"></div>
```

Instead of:

```html
<div data-corset-prop-one data-corset-prop-two data-corset-prop-three></div>
```

This means less clutter in the DOM. 

In addition to `data-corset-props` there is also `data-corset-stores` for stores and `data-corset-scope` for each scope values (item and index).