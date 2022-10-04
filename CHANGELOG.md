# corset

## 2.4.0

### Minor Changes

- 9730a91: Target the root element via :scope

## 2.3.0

### Minor Changes

- c3aaec0: Allow multiple store-set within a rule

  ```css
  #app {
    store-root: app;
    store-set: app first "Wilbur";
    store-set: app last "Phillips";
    --full-name: store-get(app, first) " " store-get(app, last);
    text: var(--full-name);
  }
  ```

- 8573803: Allow multiple store-root on an element

  You can now set multiple stores on an element:

  ```css
  #app {
    store-root: one, two;
    store-set: one name "Matthew";
    store-set: two name "Wilbur";
  }
  ```

## 2.2.3

### Patch Changes

- 8750545: var should recompute when child compute is dirty

## 2.2.2

### Patch Changes

- 5d68c7e: Prevent unnecessary function calls when a var is undefined

## 2.2.1

### Patch Changes

- 3efbd6a: Update when pushing to an empty array using longhand each

## 2.2.0

### Minor Changes

- ef19155: Allow using SVG templates

## 2.1.0

### Minor Changes

- c39d80e: Consolidate data properties

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

## 2.0.2

### Patch Changes

- cf4ca7a: Ensure changes in list update

## 2.0.1

### Patch Changes

- 23b5605: Fix to allow each to be used with attr

## 2.0.0

### Major Changes

- 25e06c5: Multi-binding properties are now additive

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
    class-toggle: all revert-sheet, two true;
  }
  ```

  Using `all` selects all active bindings for that property.

  ## Keyed property access removed

  Due to the change in making multi-binding properties be additive, there is no longer a need for keyed property access, and it has thereby been removed. This aligns Corset syntax with CSS.

  In the future no new syntax not supported by CSS will be added to Corset.

- 0e4c74b: Removes keyed properties and makes properties default additive

### Minor Changes

- 8abb1ee: Child behaviors now cause the parent to rebind
- 06bd259: Allow the :root selector for targeting the root element

### Patch Changes

- 5d3b461: Fixes bugs based on vars not being resolvable
- b76dfa5: On conflict between attach-template and text, former wins
- 921c26e: Allows a ShadowRoot to be a root element of a sheet
- 76b0c7a: Allow mount() to take a ShadowRoot
- de0927e: Fix bug with attach-template and vars
- 80fd8bf: When a data prop changes, rebind the sheet

## 2.0.0-beta.7

### Patch Changes

- 5d3b461: Fixes bugs based on vars not being resolvable

## 2.0.0-beta.6

### Patch Changes

- b76dfa5: On conflict between attach-template and text, former wins

## 2.0.0-beta.5

### Minor Changes

- 8abb1ee: Child behaviors now cause the parent to rebind

## 2.0.0-beta.4

### Patch Changes

- de0927e: Fix bug with attach-template and vars

## 2.0.0-beta.3

### Patch Changes

- 80fd8bf: When a data prop changes, rebind the sheet

## 2.0.0-beta.2

### Minor Changes

- 06bd259: Allow the :root selector for targeting the root element

### Patch Changes

- 76b0c7a: Allow mount() to take a ShadowRoot

## 2.0.0-beta.1

### Patch Changes

- 921c26e: Allows a ShadowRoot to be a root element of a sheet

## 2.0.0-beta.0

### Major Changes

- 0e4c74b: Removes keyed properties and makes properties default additive

## 1.0.2

### Patch Changes

- 3f62eae: Fixes typecheck errors

## 1.0.1

### Patch Changes

- 37fa1ef: Fixes the package.json main

## 1.0.0

### Major Changes

- 35f6cea: 1.0 Release

  The first major release of Corset establishes the current featureset as the stable APIs to build upon.

  No new features in this release, just closing off what was build in 0.8 and 0.9.

## 0.9.3

### Patch Changes

- fb1a0cf: Adds `createStore` to the function context

  This is a new function `creatStore(): Store`, provided to functions, that allow them to create new stores that are scoped to the sheet they are called within.

  This is meant to allow custom functions to asynchronously change values and have that reflect in bindings.

## 0.9.2

### Patch Changes

- 021d7ed: Fixes stores not being available when vars are set

## 0.9.1

### Patch Changes

- 68913f7: Ensure that setting a store causes invalidation

## 0.9.0

### Minor Changes

- b91646e: Adds support for Stores

  This change adds a new feature "stores". A store is a Map that can be created in any scope within a sheet. The Map will be shared within JS inside of a behavior. It can be passed to child behaviors (through inputProperties) and when a child behavior modifies it, it will rebind() the parent behavior as well.

## 0.8.14

### Patch Changes

- b939766: Fixes inputProperties types on the Map

## 0.8.13

### Patch Changes

- 0b06f3b: Improved TypeScript typings

## 0.8.12

### Patch Changes

- d3a2c5c: Fixes numbers in selectors

## 0.8.11

### Patch Changes

- 7ddfe4d: Fixes arrays being joined in the text property

## 0.8.10

### Patch Changes

- 95e3c2e: Updated CI to deploy v0 redirect

## 0.8.9

### Patch Changes

- b216c53: Final change for the CDN symlink feature

## 0.8.8

### Patch Changes

- ab2ecd4: cdn-spooky-deploy-action@v3.13

## 0.8.7

### Patch Changes

- f4b90a6: cdn-spooky-deploy-action@v3.12

## 0.8.6

### Patch Changes

- 51ffe8f: cdn-spooky-deploy-action@v3.11

## 0.8.5

### Patch Changes

- 48da0e7: cdn-spooky-deploy-action@v3.10

## 0.8.4

### Patch Changes

- 3832860: cdn-spooky-deploy-action@v3.8

## 0.8.3

### Patch Changes

- 4e70b71: Support for multiple entrypoints
- 040c860: Update for more robust semver CDN support

## 0.8.2

### Patch Changes

- d32acba: Use cdn-spooky-deploy-action 3.5

## 0.8.1

### Patch Changes

- 2e1f297: Use the CDN's new semver URL

## 0.8.0

### Minor Changes

- 115a71f: Swaps the order of the context and props args in registerCustomFunction to match registerBehavior

## 0.7.0

### Minor Changes

- 15b70f6: Replace wrap/wrapAsync with rebind

  This is a breaking change which removes wrap and wrapAsync with a new `rebind` function. Just call rebind any time state has change that necessitates calling `bind()` to get new values.

- f0594ca: Changes bind() to pass the `this` forward

## 0.6.2

### Patch Changes

- 60e1b7b: Adds the wrapAsync method to the behavior context

## 0.6.1

### Patch Changes

- 5280f3c: Adds a wrap function for wrapping callbacks in behaviors

## 0.6.0

### Minor Changes

- 5071384: # New mount API

  This change implements a new mount API, a breaking change.

  The old signature:

  ```js
  mount(root, state => {
    return sheet`

    `;
  }
  ```

  Is replace with a class rather than a proxy-based callback function. This should allow higher-level abstractions to be built on top without the magic of the proxy implementation.

  ```js
  mount(
    root,
    class {
      bind() {
        return sheet`
  
      `;
      }
    }
  );
  ```

  The API asks for a **bind** method on the passed in class that returns a sheet.

  Additionally you can probably `static inputProperties` which will give you a map of (custom) properties. This is for the next change...

  # New behavior property

  The old `mount` property is replaced with `behavior`. `mount()` is a function passed to behavior. You can mount multiple behaviors on teh same element:

  ```js
  class One {
    bind() {}
  }

  class Two {
    bind() {}
  }

  mount(
    root,
    class {
      bind() {
        return sheet`
        #app {
          behavior: mount(${One}), mount(${Two});
        }
      `;
      }
    }
  );
  ```

  Normal comma-separated rules applied. Additionally you can provide `inputProperties` and receive a map like so:

  ```js
  class One {
    static inputProperties = ["--foo"];
    constructor(props) {
      this.initial = props.get("--foo");
    }
    bind(props) {
      return sheet`
        #thing {
          text: ${this.initial + "-" + props.get("--foo")}
        }
      `;
    }
  }

  mount(
    root,
    class {
      bind() {
        return sheet`
        #app {
          behavior: mount(${One});
        }
      `;
      }
    }
  );
  ```

## 0.5.1

### Patch Changes

- 3ccb517: Adds support for longhand properties for events

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
  `;
  ```

## 0.5.0

### Minor Changes

- 31bd7cc: Keyed properties, comma-separated lists, and more

  # Breaking changes

  - Multi-binding properties now need to separate each binding with a comma:
    ```js
    #app {
      class-toggle: one ${true}, two ${two};
    }
    ```
  - Multi-binding properties now will invalidate any others that were previous applied.
  - The 3rd signature for `get()` has been removed. This is the signature that automatically looks for the `item()` within an each clause. This might be replaced by `item(name`) in the future.

  # New features

  - Keyed properties - All multi-binding properties can instead by used with their key being placed in the property name like so:

    ```js
    input {
      attr[placeholder]: "Enter your email";
    }

    #app {
      class-toggle[darkmode]: ${true};
    }
    ```

  - `var()` now expands when it contains a list, like in CSS.

    ```js
    #app {
      --opts: type "text";
    }

    input {
      attr: var(--opts);
    }
    ```

  - Custom properties can contain space-separated lists (as shown above).
  - The `attr` property is now a shorthand for `attr-value` and `attr-toggle`.

    ```js
    app {
      attr[name]: "password" ${true};
    }

    /** Is exactly equivalent to */
    app {
      attr-value[name]: "password";
      attr-toggle[name]: ${true};
    }

    /** But the second argument is optional in attr and defaults to true */
    app {
      attr[name]: "password";
    }
    ```

  - The new `registerCustomFunction` API allows you to define a custom function in JavaScript with access to input properties, the element being bounded to, and more.

  ```js
  import sheet, { registerCustomFunction } from "corset";

  registerCustomFunction(
    "--add-two",
    class {
      static inputProperties = ["--start"];
      call([a, b], _ctx, props) {
        return a + b + props.get("--start");
      }
    }
  );

  mount(
    document,
    () => sheet`
    #app {
      --start: 2;
  
      text: --add-two(${1}, ${2});
    }
  `
  );
  ```

  # What is not included

  Some features discussed didn't make it in, but could come relatively soon:

  - There is no built-in `true` and `false` yet. Instead continue using a JS insertion `${true}`.
  - There is no built-in number types yet.
  - Space-separated lists do not work within functions yet (except through a `var()`).
  - No `initial` yet.
  - No change to the `mount()` API.

- 582546b: Makes the identifiers true and false be recognized as booleans

### Patch Changes

- 59a963d: Fix for unbinding events using keyed syntax

## 0.5.0-next.1

### Patch Changes

- 59a963d: Fix for unbinding events using keyed syntax

## 0.5.0-next.0

### Minor Changes

- 31bd7cc: Keyed properties, comma-separated lists, and more

  # Breaking changes

  - Multi-binding properties now need to separate each binding with a comma:
    ```js
    #app {
      class-toggle: one ${true}, two ${two};
    }
    ```
  - Multi-binding properties now will invalidate any others that were previous applied.
  - The 3rd signature for `get()` has been removed. This is the signature that automatically looks for the `item()` within an each clause. This might be replaced by `item(name`) in the future.

  # New features

  - Keyed properties - All multi-binding properties can instead by used with their key being placed in the property name like so:

    ```js
    input {
      attr[placeholder]: "Enter your email";
    }

    #app {
      class-toggle[darkmode]: ${true};
    }
    ```

  - `var()` now expands when it contains a list, like in CSS.

    ```js
    #app {
      --opts: type "text";
    }

    input {
      attr: var(--opts);
    }
    ```

  - Custom properties can contain space-separated lists (as shown above).
  - The `attr` property is now a shorthand for `attr-value` and `attr-toggle`.

    ```js
    app {
      attr[name]: "password" ${true};
    }

    /** Is exactly equivalent to */
    app {
      attr-value[name]: "password";
      attr-toggle[name]: ${true};
    }

    /** But the second argument is optional in attr and defaults to true */
    app {
      attr[name]: "password";
    }
    ```

  - The new `registerCustomFunction` API allows you to define a custom function in JavaScript with access to input properties, the element being bounded to, and more.

  ```js
  import sheet, { registerCustomFunction } from "corset";

  registerCustomFunction(
    "--add-two",
    class {
      static inputProperties = ["--start"];
      call([a, b], _ctx, props) {
        return a + b + props.get("--start");
      }
    }
  );

  mount(
    document,
    () => sheet`
    #app {
      --start: 2;
  
      text: --add-two(${1}, ${2});
    }
  `
  );
  ```

  # What is not included

  Some features discussed didn't make it in, but could come relatively soon:

  - There is no built-in `true` and `false` yet. Instead continue using a JS insertion `${true}`.
  - There is no built-in number types yet.
  - Space-separated lists do not work within functions yet (except through a `var()`).
  - No `initial` yet.
  - No change to the `mount()` API.

## 0.4.0

### Minor Changes

- f218cae: Allows custom properties to be called as functions

## 0.3.1

### Patch Changes

- fe97d6e: Provide compressed wasm on the CDN
- 61f0e61: Removes dead code for old each-scope/index props

## 0.3.0

### Minor Changes

- d653759: Adds mount function and property
