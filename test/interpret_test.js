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
    let manyGrammar = defineGrammar(() => {
        def('S', [many('a')]);
    });
    describe('LR0Parser', () => {

    });
    describe('GLRParser', () => {
        it('simple', () => {

        });
        it('many', () => {
            let parser = new GLRParser(manyGrammar);
            parser.feed('aaa');
            expect(parser.results).to.deep.equal([]);
        });
    });
});
