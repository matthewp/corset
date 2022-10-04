---
"corset": minor
---

Allow multiple store-root on an element

You can now set multiple stores on an element:

```css
#app {
  store-root: one, two;
  store-set: one name "Matthew";
  store-set: two name "Wilbur";
}
```