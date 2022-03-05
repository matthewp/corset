import sheet, { mount, registerBehavior } from '../src/main.js';

QUnit.module('Property - store-root, store-set');

QUnit.test('Sets the root location of a store', assert => {
  let root = document.createElement('main');
  root.innerHTML = `<div id="app"></div>`;
  let bindings = sheet`
    #app {
      store-root: app;
      store-set: app foo bar;
      text: store-get(app, foo);
    }
  `;
  bindings.update(root);
  assert.equal(root.firstElementChild.textContent, 'bar');
});

QUnit.test('Are accessible with JS; setting values in JS updates the mountpoint', assert => {
  let root = document.createElement('main');
  root.innerHTML = `<div id="app"><div class="child"><button></button></div><div class="sibling"></div></div>`;
  let change;
  mount(root, class {
    constructor(props, { stores }) {
      change = () => stores.get('app')?.set('name', 'Matthew');
    }
    bind(props, { stores }) {
      return sheet`
        #app {
          --app: "testing";
          store-root: app;
        }

        .child {
          store-set: app name "Wilbur";
        }

        .child button {
          event[some-event]: ${() => stores.get('app')?.set('name', 'Anne')};
        }

        .sibling {
          text: store-get(app, name);
        }
      `;
    }
  });
  change();
  assert.equal(root.querySelector('.sibling').textContent, 'Matthew');
  root.querySelector('.child button').dispatchEvent(new CustomEvent('some-event'));
  assert.equal(root.querySelector('.sibling').textContent, 'Anne');
});

QUnit.test('Can be passed to child behaviors', assert => {
  let root = document.createElement('main');
  root.innerHTML = `<div id="app"><div class="child"><div class="inner"></div></div><div class="sibling"></div></div>`;

  class ChildBehavior {
    static inputProperties = ['--store'];
    bind(props) {
      let store = props.get('--store');
      return sheet`
        .inner {
          event[custom]: ${ev => store.set('name', ev.detail)};
        }
      `;
    }
  }

  mount(root, class {
    bind() {
      return sheet`
        #app {
          store-root: shared;
          store-set: shared name "testing";
        }

        .child {
          --store: store(shared);
          behavior: mount(${ChildBehavior});
        }

        .sibling {
          text: store-get(shared, name);
        }
      `;
    }
  });
  let sibling = root.querySelector('.sibling');
  let inner = root.querySelector('.inner');
  inner.dispatchEvent(new CustomEvent('custom', { detail: 'Wilbur'}));
  assert.equal(sibling.textContent, 'Wilbur');
});

QUnit.test('A selector becoming unmatched removes the store', assert => {
  let root = document.createElement('main');
  root.innerHTML = `<div id="app" class="show"><div class="child"></div></div>`;
  mount(root, class {
    show = true;
    bind(props) {
      return sheet`
        #app {
          class-toggle[show]: ${this.show};
          event[no-show]: ${() => this.show = false};
        }
  
        #app.show {
          store-root: app;
          store-set: app foo bar;
        }
  
        .child {
          --has-store: get(store(app), ${val => !!val});
          class-toggle[has-store]: var(--has-store);
          data[value]: get(store-get(app, foo), ${value => value || 'none'});
        }
      `;
    }
  });
  let app = root.firstElementChild;
  let child = root.querySelector('.child');
  assert.equal(child.classList.contains('has-store'), true);
  assert.equal(child.dataset.value, 'bar');

  app.dispatchEvent(new Event('no-show'));
  
  assert.equal(child.classList.contains('has-store'), false);
  assert.equal(child.dataset.value, 'none');
});

QUnit.test('Store is immediately available on the root', assert => {
  let root = document.createElement('main');
  root.innerHTML = `<div id="movies"></div>`;

  sheet`
    #movies {
      store-root: one;
      --foo: get(store(one), ${store => !!store});
      data[foo]: var(--foo);
    }
  `.update(root);
  assert.equal(root.firstElementChild.dataset.foo, 'true');
});

QUnit.test('Store is immediate available in child behavior', assert => {
  let root = document.createElement('main');
  root.innerHTML = `<div id="movies"></div>`;

  let next;

  class Fetch {
    static inputProperties = ['--store'];
    constructor(props) {
      let store = props.get('--store');
      store.set('state', 'pending');
      next = () => store.set('state', 'resolved');
    }
    bind() { return sheet``; }
  }

  mount(root, class {
    bind() {
      return sheet`
        #movies {
          store-root: request;
          --store: store(request);
          behavior: mount(${Fetch});
          --fetch-state: store-get(request, state);
          class-toggle[--fetch-state]: true;
        }

        #movies.pending {
          text: "Loading movies";
        }

        #movies.resolved {
          text: "Resolved";
        }
      `;
    }
  });

  let el = root.firstElementChild;
  assert.equal(el.className, 'pending');
  assert.equal(el.textContent, 'Loading movies');
  next();
  assert.equal(el.className, 'resolved');
  assert.equal(el.textContent, 'Resolved');
});