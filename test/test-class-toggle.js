import sheet from '../src/main.js';

QUnit.module('Property - class-toggle');

QUnit.test('Adds a class when true', assert => {
  let root = document.createElement('main');
  root.innerHTML = `<div id="app"></div>`;

  function template(value) {
    return sheet`
      #app {
        class-toggle: on ${value};
      }
    `;
  }

  template(true).update(root);
  assert.equal(root.firstElementChild.classList.contains('on'), true);
  template(false).update(root);
  assert.equal(root.firstElementChild.classList.contains('on'), false);
  // Try false again
  template(false).update(root);
  assert.equal(root.firstElementChild.classList.contains('on'), false);
});

QUnit.test('Removes a class when false', assert => {
  let root = document.createElement('main');
  root.innerHTML = `<div id="app" class="on"></div>`;
  assert.equal(root.firstElementChild.classList.contains('on'), true);
  let bindings = sheet`#app { class-toggle: on ${false}; }`;
  bindings.update(root);
  assert.equal(root.firstElementChild.classList.contains('on'), false);
});

QUnit.test('Triggers update on dependent properties', assert => {
  let root = document.createElement('main');
  root.innerHTML = `<article>Mode: <span id="mode">light</span></article>`;
  let app = {
    mode: 'light',
    toggle() {
      app.mode = app.mode === 'light' ? 'dark' : 'light';
      app.update();
    },
    update() {
      let bindings = sheet`
        article {
          class-toggle: "dark-mode" ${app.mode === 'dark'};
        }

        .dark-mode #mode {
          text: "dark";
        }
      `;
      bindings.update(root);
    }
  };

  app.update();
  assert.equal(root.querySelector('#mode').textContent, 'light');
  app.mode = 'dark';
  app.update();
  assert.equal(root.querySelector('#mode').textContent, 'dark');
});

QUnit.test('Restores the original value', assert => {
  let root = document.createElement('main');
  root.innerHTML = `<div id="app"><span class="yes"></span></div>`;

  function template(value) {
    return sheet`
      #app {
        class-toggle: on ${value};
      }

      #app.on span {
        class-toggle: yes ${false};
      }
    `;
  }

  let span = root.querySelector('span');
  template(true).update(root);
  assert.equal(span.classList.contains('yes'), false);
  template(false).update(root);
  assert.equal(span.classList.contains('yes'), true);
});

QUnit.test('Setting multiple classes', assert => {
  let root = document.createElement('main');
  root.innerHTML = `<div id="app"></div>`;
  let bindings = sheet`
    #app {
      class-toggle:
        one ${true},
        two ${true};
    }
  `;
  bindings.update(root);
  let app = root.firstElementChild;
  assert.ok(app.classList.contains('one'));
  assert.ok(app.classList.contains('two'));
});

QUnit.test('Source order is preferred', assert => {
  let root = document.createElement('main');
  root.innerHTML = `<div id="app"></div>`;
  function run() {
    return sheet`
      #app {
        class-toggle: one ${true}, three ${true};
      }

      #app {
        class-toggle: one ${true}, two ${true};
        class-toggle: three unset;
      }

      #app {
        class-toggle: four ${true};
      }
    `
  }
  run('one').update(root);
  let app = root.firstElementChild;
  assert.equal(app.classList.contains('one'), true);
  assert.equal(app.classList.contains('two'), true);
  assert.equal(app.classList.contains('three'), false);
  assert.equal(app.classList.contains('four'), true);
});

QUnit.test('Source order is preferred on change', assert => {
  let root = document.createElement('main');
  root.innerHTML = `<div id="app"></div>`;
  function run(step) {
    return sheet`
      #app {
        class-toggle: one ${true}, three ${true};
      }

      #app {
        class-toggle: one ${true}, two ${true}, three unset;
        attr: two "two" ${step === 'two'};
      }

      #app {
        class-toggle: four ${true};
      }
    `
  }
  run('one').update(root);
  let app = root.firstElementChild;
  assert.equal(app.classList.contains('one'), true);
  assert.equal(app.classList.contains('two'), true);
  assert.equal(app.classList.contains('three'), false);

  run('two').update(root);
  assert.equal(app.classList.contains('one'), true);
  assert.equal(app.classList.contains('two'), true);
  assert.equal(app.classList.contains('three'), false);
  assert.equal(app.classList.contains('four'), true);
});