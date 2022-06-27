import sheet, { mount } from '../src/main.js';

QUnit.module('Function - bind()');

QUnit.test('Can bind arguments to a function', assert => {
  assert.expect(2);
  let root = document.createElement('main');
  root.innerHTML = `<div id="app"><button type="button"></button></div>`;
  let data = {type: 'data'};
  let second = {type: 'second'};
  let callback = (arg1, arg2) => {
    assert.equal(arg1, data);
    assert.equal(arg2, second);
  };
  let bindings = sheet`
    button {
      --data: ${data};
      --second: ${second};
      event: click bind(${callback}, var(--data), var(--second));
    }
  `;
  bindings.update(root);
  root.querySelector('button').dispatchEvent(new Event('click'));
});

QUnit.test('Context is forwarded', assert => {
  let root = document.createElement('main');
  root.innerHTML = `<div id="app"></div>`;

  mount(root, class {
    message = 'none';
    count = 22;

    toggle(phrase, ev) {
      this.message = phrase + '-' + this.count + '-' + ev.type;
    }

    bind() {
      let phrase = 'catch';
      return sheet`
        #app {
          event: toggle bind(${this.toggle}, ${phrase});
          text: ${this.message};
        }
      `;
    }
  });
  let app = root.firstElementChild;
  assert.equal(app.textContent, 'none');
  app.dispatchEvent(new CustomEvent('toggle'));
  assert.equal(app.textContent, 'catch-22-toggle');
});