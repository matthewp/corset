---
"corset": minor
---

# New mount API

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
mount(root, class {
  bind() {
    return sheet`

    `;
  }
})
```

The API asks for a __bind__ method on the passed in class that returns a sheet.

Additionally you can probably `static inputProperties` which will give you a map of (custom) properties. This is for the next change...

# New behavior property

The old `mount` property is replaced with `behavior`. `mount()` is a function passed to behavior. You can mount multiple behaviors on teh same element:

```js
class One {
  bind(){

  }
}

class Two {
  bind() {

  }
}

mount(root, class {
  bind() {
    return sheet`
      #app {
        behavior: mount(${One}), mount(${Two});
      }
    `;
  }
})
```

Normal comma-separated rules applied. Additionally you can provide `inputProperties` and receive a map like so:

```js
class One {
  static inputProperties = ['--foo'];
  constructor(props) {
    this.initial = props.get('--foo');
  }
  bind(props) {
    return sheet`
      #thing {
        text: ${this.initial + '-' + props.get('--foo')}
      }
    `;
  }
}

mount(root, class {
  bind() {
    return sheet`
      #app {
        behavior: mount(${One});
      }
    `;
  }
});
```