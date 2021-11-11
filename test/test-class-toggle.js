import dsl from '../src/dsl.js';

QUnit.module('Property - class-toggle');

QUnit.test('Adds a class when true', assert => {
  let root = document.createElement('main');
  root.innerHTML = `<div id="app"></div>`;

  function template(value) {
    return dsl`
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
  let sheet = dsl`#app { class-toggle: on ${false}; }`;
  sheet.update(root);
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
      let sheet = dsl`
        article {
          class-toggle: "dark-mode" ${app.mode === 'dark'};
        }

        .dark-mode #mode {
          text: "dark";
        }
      `;
      sheet.update(root);
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
    return dsl`
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

QUnit.skip('Setting multiple classes');