import dsl from '../src/dsl.js';

QUnit.module('Property - each');

QUnit.test('Shorthand each syntax', assert => {
  let root = document.createElement('main');
  root.innerHTML = `<ul></ul><template id="todos-template"><li><span class="label"></span></li></template>`;

  let todos = [{label: 'walk the dog'}, {label: 'clean the dishes'}];
  let sheet = dsl`
    ul {
      each: ${todos} select(#todos-template) --todo;
    }

    .label {
      text: get(var(--todo), label);
    }
  `;
  sheet.update(root);
  let ul = root.firstElementChild;
  assert.equal(ul.children.length, 2);
  assert.equal(ul.querySelector(':nth-child(1) span').textContent, 'walk the dog');
  assert.equal(ul.querySelector(':nth-child(2) span').textContent, 'clean the dishes');
});

QUnit.test('Longhand syntax', assert => {
  let root = document.createElement('main');
  root.innerHTML = `<ul></ul><template id="todos-template"><li><span class="label"></span></li></template>`;

  let todos = [{label: 'walk the dog'}, {label: 'clean the dishes'}];
  let sheet = dsl`
    ul {
      each-items: ${todos};
      each-template: select(#todos-template);
      each-scope: --todo;
    }

    .label {
      text: get(var(--todo), label);
    }
  `;
  sheet.update(root);
  let ul = root.firstElementChild;
  assert.equal(ul.children.length, 2);
  assert.equal(ul.querySelector(':nth-child(1) span').textContent, 'walk the dog');
  assert.equal(ul.querySelector(':nth-child(2) span').textContent, 'clean the dishes');
});

QUnit.test('The index is available as a var', assert => {
  let root = document.createElement('main');
  root.innerHTML = `<ul></ul><template id="todos-template"><li></li></template>`;

  let items = [1];
  let sheet = dsl`
    ul {
      each-items: ${items};
      each-template: select(#todos-template);
      each-scope: --todo;
    }

    li {
      data: index var(--index);
    }
  `;
  sheet.update(root);
  let li = root.querySelector('li');
  assert.equal(Number(li.dataset.index), 0);
});

QUnit.skip('Deleting an item in a keyed list updates sibling indices');