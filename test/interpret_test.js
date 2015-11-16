import {
    defineGrammar,
    def,
    ref,
    any,
    many,
    many1,
    optional,
    bind,
    position,
    sepBy,
    choice,
    string,
    regex,
    struct,
    field
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
    let optionalGrammar = defineGrammar(() => {
        def('S', [optional('a'), 'b']);
    });
    let bindGrammar = defineGrammar(() => {
        def('S', [bind('a', (e1) => 'b')]);
    });
    let indexGrammar = defineGrammar(() => {
        def('S', [
            many(' '),
            bind([
                position(),
                many('a'),
                position()
            ], ([e1, e2, e3]) => ({start: e1, end: e3})),
            many(' ')
        ], ([e1, e2, e3]) => e2);
    });
    let sepByGrammar = defineGrammar(() => {
        def('S', [sepBy('a', ',')]);
    });
    let choiceGrammar = defineGrammar(() => {
        def('S', [choice('a', 'b')]);
    });
    let directLeftRecursiveGrammar = defineGrammar(() => {
        def('S', [ref('S'), 'a']);
        def('S', ['b']);
    });
    let stringGrammar = defineGrammar(() => {
        def('S', [string('foo')]);
    });
    let regexGrammar = defineGrammar(() => {
        def('S', [regex(/^[a]/)]);
    });
    let structFieldGrammar = defineGrammar(() => {
        def('S', struct([
            field('a', 'a'),
            'b',
            field('c', 'c')
        ]));
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
    it('optional', () => {
        expect(parse(optionalGrammar, 'ab')).to.deep.equal([['a', 'b']]);
        expect(parse(optionalGrammar, 'b')).to.deep.equal([[null, 'b']]);
    });
    it('bind', () => {
        expect(parse(bindGrammar, 'a')).to.deep.equal([['b']]);
    });
    it('index', () => {
        expect(parse(indexGrammar, ' aa ')).to.deep.equal([{start: 1, end: 3}]);
    });
    it('sepBy', () => {
        expect(parse(sepByGrammar, 'a,a,a')).to.deep.equal([[['a', 'a', 'a']]]);
    });
    it('choice', () => {
        expect(parse(choiceGrammar, 'a')).to.deep.equal([['a']]);
        expect(parse(choiceGrammar, 'b')).to.deep.equal([['b']]);
        expect(parse(choiceGrammar, 'c')).to.deep.equal([]);
    });
    it('direct left recursive', () => {
        expect(parse(directLeftRecursiveGrammar, 'baa')).to.deep.equal([[[['b'], 'a'], 'a']]);
    });
    it('string', () => {
        expect(parse(stringGrammar, 'foo')).to.deep.equal([['foo']]);
        expect(parse(stringGrammar, 'bar')).to.deep.equal([]);
    });
    it('regex', () => {
        expect(parse(regexGrammar, 'a')).to.deep.equal([['a']]);
        expect(parse(regexGrammar, 'b')).to.deep.equal([]);
    });
    it('struct / field', () => {
        expect(parse(structFieldGrammar, 'abc')).to.deep.equal([{a: 'a', c: 'c'}]);
    });
});
