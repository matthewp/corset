---
"corset": patch
---

Adds `createStore` to the function context

This is a new function `creatStore(): Store`, provided to functions, that allow them to create new stores that are scoped to the sheet they are called within.

This is meant to allow custom functions to asynchronously change values and have that reflect in bindings.