const HOLE = '[[HOLE]]';

const TOKEN = {
  UNKNOWN: 0,
  IDENTIFIER: 1,
  WHITESPACE: 2,
  SELECTOR_SPECIAL: 3,
  LEFT_BRACE: 4,
  RIGHT_BRACE: 5,
  COLON: 6,
  SEMI: 7,
  HOLE: 8
};

const NODE = {
  PROGRAM: 1,
  RULE: 2
};

function inBounds(state) {
  return state.index < state.length;
}

function current(state) {
  return state.source[state.index];
}

function peek(state) {
  return state.source[state.index + 1];
}

function advance(state, inc = 1) {
  state.index += inc;
}

function consumeWhile(state, cond) {
  let word = '';
  let char = current(state);
  while(inBounds(state) && cond(char)) {
    word += char;
    advance(state);
    char = current(state);
  }
  state.word = word;
}

function consumeIdentifier(state) {
  return consumeWhile(state, char => /[a-zA-Z]/.test(char));
}

function consumeWhitespace(state) {
  return consumeWhile(state, char => /\s/.test(char));
}

function consumeToken(state, includeWhitespace = false) {
  while(inBounds(state)) {
    let char = current(state);

    if(/[a-zA-Z]/.test(char)) {
      consumeIdentifier(state);
      return TOKEN.IDENTIFIER;
    }

    if(/[#\.]/.test(char)) {
      state.word = char;
      advance(state);
      return TOKEN.SELECTOR_SPECIAL;
    }

    if(char === '{') {
      advance(state);
      return TOKEN.LEFT_BRACE;
    }

    if(char === '}') {
      advance(state);
      return TOKEN.RIGHT_BRACE;
    }

    if(char === ':') {
      advance(state);
      return TOKEN.COLON;
    }

    if(char === ';') {
      advance(state);
      return TOKEN.SEMI;
    }

    holeCheck: if(char === '[' && peek(state) === '[') {
      let i = 0, len = HOLE.length;
      while(i < len) {
        if(state.source[state.index + i] !== HOLE[i]) {
          break holeCheck;
        }
        i++;
      }
      advance(state, len);
      return TOKEN.HOLE;
    }

    if(includeWhitespace && /\s/.test(char)) {
      consumeWhitespace(state);
      return TOKEN.WHITESPACE;
    }

    advance(state);
  }
  return TOKEN.UNKNOWN;
}

function consumeRule(state) {
  let rule = {
    selector: ''
  };
  selectorLoop: do {
    let token = consumeToken(state, true);
    switch(token) {
      case TOKEN.IDENTIFIER:
      case TOKEN.SELECTOR_SPECIAL: {
        rule.selector += state.word;
        break;
      }
      case TOKEN.WHITESPACE: {
        if(rule.selector)
          rule.selector += state.word;
        break;
      }
      case TOKEN.LEFT_BRACE: {
        break selectorLoop;
      }
      default: {
        throw new Error(`Unknown token ${token}`);
      }
    }
  } while(inBounds(state));
  rule.selector = rule.selector.trim();

  propsLoop: do {
    let decl = {value: {}};
    let token = consumeToken(state);
    switch(token) {
      case TOKEN.RIGHT_BRACE: {
        break propsLoop;
      }
      case TOKEN.IDENTIFIER: {
        decl.property = state.word;
        break;
      }
      default: {
        throw new Error('Unexpected identifier');
      }
    }

    token = consumeToken(state);
    if(token !== TOKEN.COLON) {
      throw new Error('Expected a colon');
    }

    valueLoop: do {
      token = consumeToken(state, true);
      switch(token) {
        case TOKEN.IDENTIFIER: {
          decl.value.type = 'multi';
          if(!decl.value.parts) {
            decl.value.parts = [];
          }
          decl.value.parts.push(state.word);
          break;
        }
        case TOKEN.HOLE: {
          if(decl.value.parts) {
            decl.value.parts.push({
              type: 'hole',
              index: state.holeIndex++
            });
          } else {
            decl.value.type = 'hole';
            decl.value.index = state.holeIndex++;
          }
          break;
        }
        case TOKEN.SEMI: {
          break valueLoop;
        }
      }
    } while(inBounds(state));

    
    rule[decl.property] = decl.value;
  } while(inBounds(state));
  return rule;
}

function consumeProgram(state) {
  let program = {
    type: NODE.PROGRAM,
    rules: []
  };
  while(inBounds(state)) {
    let rule = consumeRule(state);
    program.rules.push(rule);
    consumeWhitespace(state);
  }
  return program;
}

function parse(source, filename) {
  let state = {
    filename,
    source,
    index: 0,
    length: source.length,
    holeIndex: 0,
    start: {
      offset: 0,
      line: 0,
      character: 0
    },
    word: ''
  };

  let program = consumeProgram(state);
  return program;
}

function compile(strings, initialValues) {
  let holes = initialValues.map(_ => HOLE);
  let source = String.raw(strings, ...holes);
  console.time('parse1');
  let program = parse(source, 'input.dsl');
  console.timeEnd('parse1');
  
  return function(values, root) {
    for(let rule of program.rules) {
      for(let el of root.querySelectorAll(rule.selector)) {
        if(rule.text) {
          el.textContent = Reflect.get(values, rule.text.index);
        }
        if(rule.event) {
          let [eventName, {index}] = rule.event.parts;
          el.addEventListener(eventName, values[index], { once: true });
        }
      }
    }
  }
}

const cache = new WeakMap();

export default function(strings, ...values) {
  let fn;
  if(cache.has(strings)) {
    fn = cache.get(strings);
  } else {
    fn = compile(strings, values);
    cache.set(strings, fn);
  }
  return fn.bind(null, values);
}