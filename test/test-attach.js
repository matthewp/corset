import sheet from '../src/main.js';

QUnit.module('Property - attach');

QUnit.test('Attaches a template when matching selector', assert => {
  let root = document.createElement('main');
  root.innerHTML = `<div id="app"></div><template><span>works</span></template>`;
  function template(value) {
    return sheet`
      #app {
        class-toggle: enabled ${value};
      }

      #app.enabled {
        attach-template: select(template);
      }
    `;
  }
  let app = root.firstElementChild;
  template(false).update(root);
  assert.equal(app.firstChild, null, 'no first child');
  template(true).update(root);
  assert.equal(app.firstChild.localName, 'span', 'attached the span');
  assert.equal(app.firstChild.textContent, 'works');
});

QUnit.test('Restores the original value when there is no patch', assert => {
  let root = document.createElement('main');
  root.innerHTML = `<div id="app" class="enabled"><strong>orig</strong></div><template><span>works</span></template>`;
  function template(value) {
    return sheet`
      #app {
        class-toggle: enabled ${value};
      }

      #app.enabled {
        attach-template: select(template);
      }
    `;
  }
  let app = root.firstElementChild;
  let bindings = template(true);
  assert.equal(app.firstChild.localName, 'strong');
  bindings.update(root);
  assert.equal(app.firstChild.localName, 'span');
  template(false).update(root);
  assert.equal(app.firstChild.localName, 'strong');
});