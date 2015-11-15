let {defineGrammar, def, ref, many1, regex, choice} = require('maitreya/grammar');
let {GLRParser} = require('maitreya/interpret');

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
