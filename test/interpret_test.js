import {
    defineGrammar,
    def,
    ref,
    many,
    many1
} from '../src/grammar';
import {
    LR0Parser,
    GLRParser
} from '../src/interpret';

describe('interpret_test', () => {
    let simpleGrammar = defineGrammar(() => {
        def('S', [ref('A'), ref('B')]);
        def('A', ['a']);
        def('B', ['b']);
    });
    let manyGrammar = defineGrammar(() => {
        def('S', [many('a')]);
    });
    let directLeftRecursiveGrammar = defineGrammar(() => {
        def('S', [ref('S'), 'a']);
        def('S', ['b']);
    });
    describe('LR0Parser', () => {

    });
    describe('GLRParser', () => {
        function parse(grammar, input) {
            let parser = new GLRParser(grammar);
            parser.feed(input);
            return parser.results;
        }
        it('simple', () => {
            expect(parse(simpleGrammar, 'ab')).to.deep.equal([[['a'], ['b']]]);
        });
        it('many', () => {
            expect(parse(manyGrammar, 'aaa')).to.deep.equal([['a', 'a', 'a']]);
        });
        it('direct left recursive', () => {
            expect(parse(directLeftRecursiveGrammar, 'baa')).to.deep.equal([[[['b'], 'a'], 'a']]);
        });
    });
});
