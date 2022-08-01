import sheet from '../src/main.js';

QUnit.module('Property - each');

QUnit.test('Shorthand each syntax', assert => {
  let root = document.createElement('main');
  root.innerHTML = `<ul></ul><template id="todos-template"><li><span class="label"></span></li></template>`;

  let todos = [{label: 'walk the dog'}, {label: 'clean the dishes'}];
  let bindings = sheet`
    ul {
      each: ${todos} select(#todos-template);
    }

    li {
      --todo: item();
    }

    .label {
      text: get(var(--todo), label);
    }
  `;
  bindings.update(root);
  let ul = root.firstElementChild;
  assert.equal(ul.children.length, 2);
  assert.equal(ul.querySelector(':nth-child(1) span').textContent, 'walk the dog');
  assert.equal(ul.querySelector(':nth-child(2) span').textContent, 'clean the dishes');
});

QUnit.test('Longhand syntax', assert => {
  let root = document.createElement('main');
  root.innerHTML = `<ul></ul><template id="todos-template"><li><span class="label"></span></li></template>`;

  let todos = [{label: 'walk the dog'}, {label: 'clean the dishes'}];
  let bindings = sheet`
    ul {
      each-items: ${todos};
      each-template: select(#todos-template);
    }

    .label {
      text: get(item(), label);
    }
  `;
  bindings.update(root);
  let ul = root.firstElementChild;
  assert.equal(ul.children.length, 2);
  assert.equal(ul.querySelector(':nth-child(1) span').textContent, 'walk the dog');
  assert.equal(ul.querySelector(':nth-child(2) span').textContent, 'clean the dishes');
});

QUnit.test('The index is available as index()', assert => {
  let root = document.createElement('main');
  root.innerHTML = `<ul></ul><template id="todos-template"><li></li></template>`;

  let items = [1];
  let bindings = sheet`
    ul {
      each-items: ${items};
      each-template: select(#todos-template);
    }

    li {
      data: index index();
    }
  `;
  bindings.update(root);
  let li = root.querySelector('li');
  assert.equal(Number(li.dataset.index), 0);
});

QUnit.test('Deleting an item in a keyed list updates sibling indices', assert => {
  let root = document.createElement('main');
  root.innerHTML = `<ul></ul><template><li>index: <span id="index"></span></li></template>`;
  let items = [{id: 1}, {id: 2}, {id: 3}];
  function template() {
    return sheet`
      ul {
        each-items: ${items};
        each-template: select(template);
        each-key: id;
      }
      li {
        attr: id get(item(), ${item => `item-${item.id}`});
      }
      li #index {
        text: index();
      }
    `;
  }
  template().update(root);
  items.splice(1, 1);
  template().update(root);
  assert.equal(root.querySelector('#item-1 #index').textContent, 0);
  assert.equal(root.querySelector('#item-3 #index').textContent, 1);
});

QUnit.test('Can be used with attr', assert => {
  let root = document.createElement('main');
  root.innerHTML = `<div class="selector" aria-label="color-theme"></div><template><span></span></template>`;
  sheet`
    .selector {
      attr: role "group";
      attr: tabindex 0;
      each-items: ${[{id:1}, {id:2}]};
      each-template: select(template);
      each-key: id;
    }
  `.update(root);

  let s = root.firstElementChild;
  assert.equal(s.getAttribute('tabindex'), '0');
  assert.equal(s.getAttribute('role'), 'group');

  assert.equal(s.children.length, 2);
});

QUnit.test('Changes to items result in updates', assert => {
  let root = document.createElement('main');
  root.innerHTML = `<ul></ul><template><li></li></template>`;
  let items = [{id: 1, label: 'one'}, {id: 2, label: 'two'}];
  function bind() {
    return sheet`
      ul {
        each: ${items} select(template) id;
      }

      li {
        text: get(item(), label);
      }
    `;
  }
  let ul = root.firstElementChild;
  bind().update(root);
  
  assert.equal(ul.firstElementChild.textContent, 'one');
  assert.equal(ul.firstElementChild.nextElementSibling.textContent, 'two');

  items[1].label = 'two !!';
  bind().update(root);
  assert.equal(ul.firstElementChild.textContent, 'one');
  assert.equal(ul.firstElementChild.nextElementSibling.textContent, 'two !!');
});