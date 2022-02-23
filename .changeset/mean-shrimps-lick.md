---
"corset": minor
---

Replace wrap/wrapAsync with rebind

This is a breaking change which removes wrap and wrapAsync with a new `rebind` function. Just call rebind any time state has change that necessitates calling `bind()` to get new values.