import {
    defineGrammar,
    def,
    ref,
} from '../src/types';
import preprocess from '../src/preprocess';

let testGammar = defineGrammar(() => {
    def('S', [ref('A'), ref('B')]);
    def('A', ['a']);
    def('B', ['b']);
});

console.log(preprocess(testGammar));