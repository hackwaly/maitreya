# Maitreya

[![Build Status](https://travis-ci.org/hackwaly/maitreya.svg)](https://travis-ci.org/hackwaly/maitreya)

Maitreya is a generalized LR parser generator written in javascript.

When you want to design and implement a new programming language. You want to prototype the grammar quickly. You may change the grammar over over again. I have used PEGjs. It still far away my goal. So, I wrote Maitreya. With the power of generalized LR parser, free your mind away from "left recursive", “shift/reduce reduce/reduce conflict”, "ambiguity", "look ahead", "separated list" ...

## Features

- Accept GLR grammars, not limited to LR(k) grammars.
- Support incremental (not yet) / streaming parsing.
- Can do both scanner less parsing and token based parsing.
- Can build grammar on the fly by using parser combinators.
- Support both interpretation and code genearation.

## Example

```javascript
import {defineGrammar, def, ref, many1, regex, choice} from 'maitreya/grammar';
import {GLRParser} from 'maitreya/interpret';

let grammar = defineGrammar(() => {
  def('exp', [ref('num')], ([num]) => num);
  def('exp', [ref('exp'), ref('op'), ref('exp')], ([lhs, op, rhs]) => op(lhs, rhs));
  def('num', [many1(regex(/^[0-9]/))], ([digits]) => Number(digits.join('')));
  def('op', [choice('+', '-')], ([op]) => {
    return {
      ['+'](lhs, rhs) { return lhs + rhs; },
      ['-'](lhs, rhs) { return lhs - rhs; }
    }[op];
  });
});

let parser = new GLRParser(grammar);
parser.feed('3+2-5');
console.log(parser.results);
```
Still interested? Look at the [API Reference](https://github.com/hackwaly/maitreya/wiki/API-Reference)

## Todos

- [x] Interpret mode.
- [ ] Code generation frontend.
- [ ] Code generation backends.
- [ ] Complete the test cases.
- [ ] API documentation and website.
- [ ] Performance benchmark and optimisation.
