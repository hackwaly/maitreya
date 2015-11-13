# Maitreya

[![Build Status](https://travis-ci.org/hackwaly/maitreya.svg)](https://travis-ci.org/hackwaly/maitreya)

Maitreya is a generalized LR parser generator written in javascript.

When you want to design and implement a new programming language. You want to prototype the grammar quickly. You may change the grammar over over again. I have used PEGjs. It still far away my goal. So, I wrote Maitreya. With the power of generalized LR parser, free your mind away from "left recursive", "ambiguity", "look ahead", "separated list" ...

## Features

- Accept GLR grammar, not limited to LR(k) grammar.
- Can do both scanner less parsing and token based parsing.
- Can build grammar on the fly by using parser combinators.
- Support both interpretation and code genearation.

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

- [x] Interpret mode.
- [ ] Code generation frontend.
- [ ] Code generation backends.
- [ ] Complete the test cases.
- [ ] API documentation and website.
- [ ] Performance benchmark and optimisation.
