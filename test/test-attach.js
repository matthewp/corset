import sheet, { mount } from '../src/main.js';

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

QUnit.test('Restores the original value when there is no match', assert => {
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

QUnit.test('Can use a variable from another selector', assert => {
  let root = document.createElement('main');
  root.innerHTML = `<div id="app"></div>`;
  let template = document.createElement('template');
  template.innerHTML = `<div>works</div>`;
  let bindings = sheet`
    #app {
      --template: ${template};
      class-toggle: attached true;
    }
    .attached {
      attach-template: var(--template);
    }
  `;
  bindings.update(root);
  assert.equal(root.firstElementChild.firstElementChild.textContent, 'works');
});

QUnit.test('If text resets and an attach-template occurs, text does not get reset', assert => {
  let root = document.createElement('main');
  root.innerHTML = `<div id="app"></div>`;
  let template = document.createElement('template');
  template.innerHTML = `<span>works</span>`;
  class ClassBehavior {
    static inputProperties = ['--cn'];
    bind(props) {
      let className = props.get('--cn');
      return sheet`
        :root {
          class-toggle: ${className} ${className};
        }
      `;
    }
  }
  let props = new Map();
  props.set('--cn', 'one');
  let mp = mount(root, class {
    bind(props) {
      return sheet`
        #app {
          --cn: ${props.get('--cn')};
          behavior: mount(${ClassBehavior});
        }

        .one {
          text: "one";
        }

        .two {
          attach-template: ${template};
        }
      `;
    }
  }, props);
  let app = root.firstElementChild;

  assert.equal(app.textContent, 'one');
  props.set('--cn', 'two');
  mp.update();
  assert.ok(app.firstElementChild, 'Has a change element');
  assert.equal(app.firstElementChild.localName, 'span');
  assert.equal(app.firstElementChild.textContent, 'works');
});

QUnit.test('Selector bound by another binding can be toggled on and off', assert => {
  let root = document.createElement('main');
  root.innerHTML = `<div id="app"></div>`;
  let template = document.createElement('template');
  template.innerHTML = `<span>worked</span>`;
  function run(value) {
    return sheet`
      #app {
        class-toggle: one ${value};
      }

      .one {
        --value: ${template};
        attach-template: var(--value);
      }
    `;
  }
  let app = root.firstElementChild;
  run(true).update(root);
  assert.equal(app.firstElementChild.localName, 'span');
  run(false).update(root);
  assert.equal(app.firstElementChild, null);
  run(true).update(root);
  assert.equal(app.firstElementChild.localName, 'span');
});