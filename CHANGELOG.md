# corset

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
