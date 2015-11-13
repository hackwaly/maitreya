import {
    defineGrammar,
    def,
    ref,
} from '../src/types';
import preprocess from '../src/preprocess';
import {LR0Parser} from '../src/interpret';

let testGrammar = defineGrammar(() => {
    def('S', [ref('A'), ref('B')]);
    def('A', ['a']);
    def('B', ['b']);
});

//let startState = preprocess(testGrammar);
//console.log(startState);

let parser = new LR0Parser(testGrammar);
parser.feed('ab');
console.log(parser);
