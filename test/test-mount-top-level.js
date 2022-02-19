import sheet, { mount } from '../src/main.js';

QUnit.module('mount(el, Behavior)');

QUnit.test('Updates on state changes', assert => {
  let root = document.createElement('main');
  root.innerHTML = `<div id="app"><button type="button">Increment</button><span id="count"></span></div>`;

  mount(root, class {
    count = 0;
    increment() {
      this.count++;
    }
    bind() {
      let { count, increment } = this;
      return sheet`
        button {
          event: click ${increment};
        }

        #count {
          text: ${count};
        }
      `;
    }
  });

  root.querySelector('button').dispatchEvent(new Event('click'));

  assert.equal(root.querySelector('#count').textContent, 1);
});