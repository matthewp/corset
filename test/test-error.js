import sheet from '../src/main.js';

QUnit.module('Errors');

QUnit.test('Get good error message when using single quotes for strings', assert => {
  assert.throws(() => sheet`
    #app { text: 'test'; }
  `, /Use double quotes/, 'should throw on single quotes');
});