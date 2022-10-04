---
"corset": minor
---

Allow multiple store-set within a rule

```css
#app {
  store-root: app;
  store-set: app first "Wilbur";
  store-set: app last "Phillips";
  --full-name: store-get(app, first) " " store-get(app, last);
  text: var(--full-name);
}
```
