import dsl from '../src/dsl.js';

QUnit.module('Property - prop');

QUnit.test('Sets a property', assert => {
  customElements.define('my-prop-element', class extends HTMLElement {
    set name(name) {
      this.textContent = `Hello ${name}`;
    }
  });
  let root = document.createElement('main');
  root.innerHTML = `<my-prop-element></my-prop-element>`;
  let sheet = dsl`
    my-prop-element {
      prop: name "world";
    }
  `;
  sheet.update(root);
  assert.equal(root.firstElementChild.textContent, 'Hello world');
});

QUnit.test('Can be set by a custom property', assert => {
  customElements.define('my-prop-element-two', class extends HTMLElement {
    set name(name) {
      this.textContent = `Hello ${name}`;
    }
  });
  let root = document.createElement('main');
  root.innerHTML = `<div id="app"><my-prop-element-two></my-prop-element-two></div>`;
  function template(value) {
    return dsl`
      #app {
        class-toggle: pet ${value};
      }

      .pet {
        --name: "Wilbur";
      }

      my-prop-element-two {
        prop: name var(--name, "world");
      }
    `;

  }
  template(false).update(root);
  assert.equal(root.firstElementChild.textContent, 'Hello world');
  template(true).update(root);
  assert.equal(root.firstElementChild.textContent, 'Hello Wilbur');
});