import {
    defineGrammar,
    def,
    ref,
    any,
    many,
    many1,
    sepBy
} from '../src/grammar';
import {
    GLRParser
} from '../src/interpret';
import {expect} from 'chai';

describe('interpret_test', () => {
    let simpleGrammar = defineGrammar(() => {
        def('S', [ref('A'), ref('B')]);
        def('A', ['a']);
        def('B', ['b']);
    });
    let anyGrammar = defineGrammar(() => {
        def('S', [any]);
    });
    let manyGrammar = defineGrammar(() => {
        def('S', [many('a')]);
    });
    let sepByGrammar = defineGrammar(() => {
        def('S', [sepBy('a', ',')]);
    });
    let directLeftRecursiveGrammar = defineGrammar(() => {
        def('S', [ref('S'), 'a']);
        def('S', ['b']);
    });

    function parse(grammar, input) {
        let parser = new GLRParser(grammar);
        parser.feed(input);
        return parser.results;
    }

    it('simple', () => {
        expect(parse(simpleGrammar, 'ab')).to.deep.equal([[['a'], ['b']]]);
    });
    it('any', () => {
        expect(parse(anyGrammar, 'a')).to.deep.equal([['a']]);
        expect(parse(anyGrammar, 'b')).to.deep.equal([['b']]);
    });
    it('many', () => {
        expect(parse(manyGrammar, 'aaa')).to.deep.equal([[['a', 'a', 'a']]]);
    });
    it('sepBy', () => {
        expect(parse(sepByGrammar, 'a,a,a')).to.deep.equal([[['a', 'a', 'a']]]);
    });
    it('direct left recursive', () => {
        expect(parse(directLeftRecursiveGrammar, 'baa')).to.deep.equal([[[['b'], 'a'], 'a']]);
    });
});
