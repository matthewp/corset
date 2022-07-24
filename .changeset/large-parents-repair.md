---
"corset": major
---

Multi-binding properties are now additive

In Corset 2.0, multi-binding properties are now additive. That means if you use the `class-toggle`, `each`, `prop`, `data`, or `attr` properties, the values you set will be added to the element, but will not remove previous values added.

In Corset 1.0 these multi-binding properties were destructive. This meant if you did:

```css
#app {
  class-toggle: one true;
}

#app {
  class-toggle: two true;
}
```

Only the `two` class would be on the element. In Corset 2.0 both `one` and `two` will be set.

## revert-sheet and all keywords

To allow you to remove previous bindings, Corset 2.0 has new `revert-sheet` and `all` keywords. To remove previous bindings, as in above, you would now do:

```css
#app {
  class-toggle: one true;
}

#app {
  class-toggle:
    all revert-sheet,
    two true;
}
```

Using `all` selects all active bindings for that property.

## Keyed property access removed

Due to the change in making multi-binding properties be additive, there is no longer a need for keyed property access, and it has thereby been removed. This aligns Corset syntax with CSS.

In the future no new syntax not supported by CSS will be added to Corset.