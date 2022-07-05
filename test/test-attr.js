import sheet from '../src/main.js';

QUnit.module('Property - attr');

QUnit.test('Set an attribute value', assert => {
  let root = document.createElement('main');
  root.innerHTML = `<div id="app"></div>`;

  let bindings = sheet`
    #app {
      attr: name ${'world'};
    }
  `;

  bindings.update(root);
  assert.equal(root.firstElementChild.getAttribute('name'), 'world');
});

QUnit.test('Can set multiple attributes', assert => {
  let root = document.createElement('main');
  root.innerHTML = `<div id="app"><table></table></div>`;
  let bindings = sheet`
    table {
      attr:
        id "my-table",
        class "flat";
    }
  `;
  bindings.update(root);
  let table = root.querySelector('table');
  assert.equal(table.id, 'my-table');
  assert.equal(table.className, 'flat');
});

QUnit.test('Non-keyed shorthand', assert => {
  let root = document.createElement('main');
  root.innerHTML = `<input>`;
  let mp = () => sheet`
    input {
      attr: type text, placeholder "testing";
    }
  `;
  mp().update(root);
  let input = root.firstElementChild;
  assert.equal(input.getAttribute('type'), 'text');
  assert.equal(input.getAttribute('placeholder'), 'testing');
});

QUnit.test('Keyed attribute shorthand', assert => {
  let root = document.createElement('main');
  root.innerHTML = `<input>`;
  let mp = enabled => sheet`
    input {
      attr[type]: text ${enabled};
    }
  `;
  mp(true).update(root);
  let input = root.querySelector('input');
  assert.equal(input.getAttribute('type'), 'text');
  mp(false).update(root);
  assert.equal(input.hasAttribute('type'), false);
});

QUnit.skip('Keyed attribute longhand', assert => {
  let root = document.createElement('main');
  root.innerHTML = `<input>`;
  function run(showDisabled) {
    return sheet`
    input {
      attr-value: type "text";
      attr-toggle: disabled ${showDisabled};
    }
  `;
  }
  run(true).update(root);
  let input = root.querySelector('input');
  assert.equal(input.getAttribute('type'), 'text');
  assert.equal(input.hasAttribute('disabled'), true);
  assert.equal(input.getAttribute('disabled'), '');
  run(false).update(root);
  assert.equal(input.hasAttribute('disabled'), false);
});

QUnit.skip('Non-keyed shorthand overrides other bindings', assert => {
  let root = document.createElement('main');
  root.innerHTML = `<input>`;
  function run(enable) {
    return sheet`
      input {
        attr[type]: text;
        class-toggle[form-element]: ${enable};
      }

      input.form-element {
        attr: placeholder "testing";
      }
    `;
  }
  let input = root.firstElementChild;
  run(false).update(root);
  assert.equal(input.getAttribute('type'), 'text');
  assert.equal(input.classList.contains('form-element'), false);
  run(true).update(root);
  assert.equal(input.classList.contains('form-element'), true);
  assert.equal(input.getAttribute('placeholder'), 'testing');
  assert.equal(input.hasAttribute('type'), false);
});

QUnit.skip('Source order is preferred', assert => {
  let root = document.createElement('main');
  root.innerHTML = `<div id="app"></div>`;
  function run(toggle) {
    return sheet`
      #app {
        attr: one one, two two;
        class-toggle[toggle]: ${toggle};
      }

      #app {
        attr[three]: three;
      }

      #app {
        attr-value[four]: four;
      }

      #app.toggle {
        attr-toggle[four]: ${false};
      }
    `;
  }
  let app = root.firstElementChild;
  run(false).update(root);
  assert.equal(app.getAttribute('one'), 'one');
  assert.equal(app.getAttribute('two'), 'two');
  assert.equal(app.getAttribute('three'), 'three');
  assert.equal(app.getAttribute('four'), 'four');

  run(true).update(root);
  assert.equal(app.getAttribute('one'), 'one');
  assert.equal(app.getAttribute('two'), 'two');
  assert.equal(app.getAttribute('three'), 'three');
  assert.equal(app.hasAttribute('four'), false);
});