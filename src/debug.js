import {
    defineGrammar,
    def,
    ref,
} from '../src/grammar';
import preprocess from '../src/preprocess';
import {LR0Parser, GLRParser} from '../src/interpret';

let lr0Grammar = defineGrammar(() => {
    def('S', [ref('A'), ref('B')]);
    def('A', ['a']);
    def('B', ['b']);
});

let glrGrammar = defineGrammar(() => {
    def('E', []);
    def('E', ['(', ref('E'), ')']);
});

//let startState = preprocess(testGrammar);
//console.log(startState);

let parser = new GLRParser(glrGrammar);
parser.feed('((()))');
console.log(parser);
