---
"corset": minor
---

Keyed properties, comma-separated lists, and more

# Breaking changes

- Multi-binding properties now need to separate each binding with a comma:
```js
#app {
  class-toggle: one ${true}, two ${two};
}
```
-
