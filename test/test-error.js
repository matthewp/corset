import dsl from '../src/dsl.js';

QUnit.module('Errors');

QUnit.test('Get good error message when using single quotes for strings', assert => {
  assert.throws(() => dsl`
    #app { text: 'test'; }
  `, /Use double quotes/, 'should throw on single quotes');
});