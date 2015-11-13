# Maitreya

[![Build Status](https://travis-ci.org/hackwaly/maitreya.svg)](https://travis-ci.org/hackwaly/maitreya)

Maitreya is a generalized LR parser generator written in javascript.

## Features

- Can do both scanner less parsing and token based parsing.
- Can build grammar on the fly by using parser combinators.
- Support both interpret mode and compiled mode.

## Example

```javascript
import {defineGrammar, def, ref, many} from 'maitreya/grammar';
import {GLRParser} from 'maitreya/interpret';
let grammar = defineGrammar(() => {
    def('S', [many(ref('P'))]);
    def('P', []);
    def('P', ['(', ref('P') ')']);
});
let parser = new GLRParser(grammar);
parser.feed('(())()');
console.log(parser.results);
```

## Todos

- [x] Interpret mode
- [ ] Code generation frontend
- [ ] Code generation backends
- [ ] Complete the test cases
- [ ] Performance benchmark and optimisation