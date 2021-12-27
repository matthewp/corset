import sheet from '../src/main.js';

QUnit.module('Language');

QUnit.test('Attribute selectors work', assert => {
  let root = document.createElement('div');
  root.innerHTML = `<div foo></div>`;
  let bindings = sheet`
    [foo] {
      text: ${'works'};
    }
  `;
  bindings.update(root);
  assert.equal(root.firstElementChild.textContent, 'works');
});

QUnit.test('Comments are supported', assert => {
  let root = document.createElement('div');
  root.innerHTML = `<div id="app"></div>`;
  let bindings = sheet`
    #app {
      /* Setting the text here */
      text: "works";
    }
  `;
  bindings.update(root);
  assert.equal(root.firstElementChild.textContent, 'works');
});

QUnit.test('Can handle large bindingss', assert => {
  assert.expect(1);
  const fn = () => {};

  // Note that the indentation is important for this test.
  let bindings = sheet`
            #run {
                event: click ${fn};
            }

            #runlots {
                event: click ${fn};
            }

            #add {
                event: click ${fn};
            }

            #update {
                event: click ${fn};
            }

            #clear {
                event: click ${fn};
            }

            #swaprows {
                event: click ${fn};
            }

            table {
                event: click ${fn};
            }

            tbody {
                each-template: select(#row-template);
                each-items: ${[]};
                each-key: id;
            }

            tr {
                attr: id get(id);
                class-toggle: danger get(${fn});
            }

            .id-column {
                text: get(id);
            }

            .select-action {
                text: get(label);
                data: id get(id);
            }

            .remove-action span {
                data: id get(id);
            }
        `;

  assert.ok(bindings, 'did not throw');
});