# corset

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
