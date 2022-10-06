import sheet from '../src/main.js';

QUnit.module('Property - event');

QUnit.test('Adds an event listener', assert => {
  let root = document.createElement('main');
  root.innerHTML = `<button type="button"></button>`;
  let called = false;
  let cb = () => called = true;

  let bindings = sheet`button { event: click ${cb}; }`;
  bindings.update(root);
  root.firstElementChild.dispatchEvent(new Event('click'));
  assert.ok(called);
});

QUnit.test('Unbinds from previous callback when it changes', assert => {
  let root = document.createElement('main');
  root.innerHTML = `<button type="button"></button>`;
  let count = 0;
  let cb = () => count++;

  function template() {
    return sheet`
      button {
        --cb: ${cb.bind(null)};
        event: click var(--cb);
      }
    `;
  }


  template().update(root);
  root.firstElementChild.dispatchEvent(new Event('click'));
  assert.equal(count, 1);

  template().update(root);
  root.firstElementChild.dispatchEvent(new Event('click'));
  assert.equal(count, 2);
});

QUnit.test('Can listen to multiple events on the same element', assert => {
  let root = document.createElement('main');
  root.innerHTML = `<button type="button"></button>`;
  let count1 = 0, count2 = 0;
  let cb1 = () => count1++;
  let cb2 = () => count2++;

  let bindings = sheet`
    button {
      event:
        "custom-one" ${cb1},
        "custom-two" ${cb2};
    }
  `;

  bindings.update(root);
  root.firstElementChild.dispatchEvent(new Event('custom-one'));
  assert.equal(count1, 1);

  root.firstElementChild.dispatchEvent(new Event('custom-two'));
  assert.equal(count2, 1);
  assert.equal(count1, 1);
});

QUnit.test('Supports longhand event-listener and event-capture', assert => {
  let root = document.createElement('main');
  root.innerHTML = `<div id="outer"><button type="button"></button></div>`;
  let count1 = 0, count2 = 0;
  let cb1 = () => count1++;
  let cb2 = ev => {
    ev.stopPropagation();
    count2++;
  };

  let bindings = sheet`
    #outer {
      event-listener: one ${cb2};
      event-capture: one true;
    }

    button {
      event-listener: one ${cb1};
    }
  `;

  bindings.update(root);
  let btn = root.querySelector('button');
  btn.dispatchEvent(new CustomEvent('one', { bubbles: true }));
  assert.equal(count1, 0);
  assert.equal(count2, 1);
});

QUnit.test('Unbinds a capture listener correctly', assert => {
  let root = document.createElement('main');
  root.innerHTML = `<div id="outer"><button type="button"></button></div>`;
  let count1 = 0;
  let cb1 = () => count1++;

  function run(show) {
    return sheet`
      #outer {
        class-toggle: dead ${show};
      }

      #outer:not(.dead) {
        event-listener: one ${cb1};
        event-capture: one true;
      }
    `;
  }

  run(false).update(root);
  let btn = root.querySelector('button');
  btn.dispatchEvent(new CustomEvent('one', { bubbles: true }));
  assert.equal(count1, 1);
  run(true).update(root);
  btn.dispatchEvent(new CustomEvent('one', { bubbles: true }));
  assert.equal(count1, 1)
});

QUnit.test('Supports longhand event-once', assert => {
  let root = document.createElement('main');
  root.innerHTML = `<div id="outer"><button type="button"></button></div>`;
  let count1 = 0;
  let cb1 = () => count1++;

  let bindings = sheet`
    button {
      event-listener: one ${cb1};
      event-once: one true;
    }
  `;

  bindings.update(root);
  let btn = root.querySelector('button');
  btn.dispatchEvent(new CustomEvent('one', { bubbles: true }));
  assert.equal(count1, 1);
  btn.dispatchEvent(new CustomEvent('one', { bubbles: true }));
  assert.equal(count1, 1);
});

QUnit.test('Supports longhand event-passive', assert => {
  let root = document.createElement('main');
  root.innerHTML = `<div id="outer"><button type="button"></button></div>`;
  let prevented = false;
  let cb1 = ev => {
    ev.preventDefault();
    prevented = ev.defaultPrevented;
  };

  let bindings = sheet`
    button {
      event-listener: one ${cb1};
      event-passive: one true;
    }
  `;

  bindings.update(root);
  let btn = root.querySelector('button');
  btn.dispatchEvent(new CustomEvent('one', {cancelable: true}));
  assert.equal(prevented, false, 'Called preventDefault but ignored because passive');
});

QUnit.test('Supports longhand event-signal', assert => {
  let root = document.createElement('main');
  root.innerHTML = `<div id="outer"><button type="button"></button></div>`;
  let count = 0;
  let cb1 = ev => count++;

  let controller = new AbortController();

  let bindings = sheet`
    button {
      event-listener: one ${cb1};
      event-signal: one ${controller.signal};
    }
  `;

  bindings.update(root);
  let btn = root.querySelector('button');

  btn.dispatchEvent(new CustomEvent('one'));
  assert.equal(count, 1);
  controller.abort();

  btn.dispatchEvent(new CustomEvent('one'));
  assert.equal(count, 1);
});

QUnit.test('Options work in shorthand syntax', assert => {
  let root = document.createElement('main');
  root.innerHTML = `<div id="outer"><button type="button"></button></div>`;
  let count1 = 0, count2 = 0;
  let cb1 = () => count1++;
  let cb2 = ev => {
    ev.stopPropagation();
    count2++;
  };

  let bindings = sheet`
    #outer {
      event: one ${cb2} true true;
    }

    button {
      event-listener: one ${cb1};
    }
  `;

  bindings.update(root);
  let btn = root.querySelector('button');
  btn.dispatchEvent(new CustomEvent('one', { bubbles: true }));
  assert.equal(count1, 0);
  assert.equal(count2, 1);
  btn.dispatchEvent(new CustomEvent('one', { bubbles: true }));
  assert.equal(count1, 1);
  assert.equal(count2, 1);
});

QUnit.test('Event can be labeled', assert => {
  let root = document.createElement('main');
  root.innerHTML = `<div id="one"></div>`;
  let count = 0;
  let cb = () => count++;
  sheet`
    #one {
      event: [name] one ${cb};
    }

    #one {
      event-once: [name] true;
    }
  `.update(root);
  root.firstElementChild.dispatchEvent(new Event('one'));
  assert.equal(count, 1);
  root.firstElementChild.dispatchEvent(new Event('one'));
  assert.equal(count, 1);
});

QUnit.test('event-target allows specifying a different target', assert => {
  let root = document.createElement('main');
  root.innerHTML = `<div id="app"></div>`;
  let target = new EventTarget();
  let events = [];
  function bind(show) {
    return sheet`
      #app {
        class-toggle: show ${show};
      }

      #app.show {
        event: foo ${ev => events.push(ev)};
        event-target: foo ${target};
      }
    `;
  }
  bind(true).update(root);

  target.dispatchEvent(new CustomEvent('foo', { detail: { foo: 'bar' }}));
  assert.equal(events.length, 1);
  assert.deepEqual(events[0].detail, { foo: 'bar' });

  bind(false).update(root);
  target.dispatchEvent(new CustomEvent('foo', { detail: { foo: 'bar' }}));
  assert.equal(events.length, 1);

  target = window;
  bind(true).update(root);
  target.dispatchEvent(new CustomEvent('foo', { detail: { foo: 'bar' }}));
  assert.equal(events.length, 2);

  bind(false).update(root);
  target.dispatchEvent(new CustomEvent('foo', { detail: { foo: 'bar' }}));
  assert.equal(events.length, 2);
});

QUnit.test('event-target targets get unmounted on unmount()', assert => {
  let root = document.createElement('main');
  root.innerHTML = `<div id="app"></div>`;
  let target = new EventTarget();
  let events = [];
  let sheet1 = sheet`
    #app {
      event-listener: foo ${ev => events.push(ev)};
      event-target: foo ${target};
    }
  `;
  sheet1.update(root);
  target.dispatchEvent(new Event('foo'));
  assert.equal(events.length, 1);

  sheet1.unmount(root);
  target.dispatchEvent(new Event('foo'));
  assert.equal(events.length, 1);
});