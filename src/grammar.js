import {START, ANY, Reject, Grammar, Nonterminal, Production} from './types';

let currentGrammar = null;

export function def(id, symbols, action, isGenerated = false) {
    let nonterminal = ref(id);
    let production = new Production(nonterminal, symbols, action);
    nonterminal.productions.push(production);
    if (!isGenerated && currentGrammar.start === null) {
        currentGrammar.start = nonterminal;
    }
}

export function ref(id) {
    let nonterminal = currentGrammar.nonterminals[id];
    if (nonterminal === undefined) {
        nonterminal = new Nonterminal(id);
        currentGrammar.nonterminals[id] = nonterminal;
    }
    return nonterminal;
}

//region { Utilities }

// TODO: Use Immutable struct to deduplicate.

export const any = ANY;

class Rule extends Nonterminal {
    constructor() {
        super(Symbol());
        currentGrammar[this.id] = this;
    }
    def(symbols, action = null) {
        this.productions.push(new Production(this, symbols, action));
    }
}

export function reject(error) {
    return new Reject(error);
}

class BindRule extends Rule {
    constructor(symbol, action) {
        super();
        if (Array.isArray(symbol)) {
            this.def(symbol, (es) => action(es));
        } else {
            this.def([symbol], ([es]) => action(es));
        }
    }
}

export function bind(symbol, action) {
    return new BindRule(symbol, action);
}

class GroupRule extends Rule {
    constructor(symbols) {
        super();
        this.def(symbols);
    }
}

export function group(...symbols) {
    return new GroupRule(symbols);
}

class StringRule extends Rule {
    constructor(literal) {
        super();
        this.literal = literal;
        this.def(literal.split(''), (es) => es.join(''));
    }
    toString() {
        return JSON.stringify(this.literal);
    }
}

export function string(literal) {
    return new StringRule(literal);
}

class RegexRule extends Rule {
    constructor(regex) {
        super();
        this.regex = regex;
        this.def([any], ([e1]) => {
            if (!regex.test(e1)) {
                return reject(`expect ${this}`);
            }
            return e1;
        });
    }
    toString() {
        return `${this.regex.source}`;
    }
}

export function regex(regex) {
    return new RegexRule(regex);
}

class ManyRule extends Rule {
    constructor(symbol) {
        super();
        this.symbol = symbol;
        this.def([], () => []);
        this.def([symbol, this], ([e1, e2]) => [e1, ...e2]);
    }
    toString() {
        return `${this.symbol}*`;
    }
}

export function many(symbol) {
    return new ManyRule(symbol);
}

class Many1Rule extends Rule {
    constructor(symbol) {
        super();
        this.symbol = symbol;
        this.def([symbol, many(symbol)], ([e1, e2]) => [e1, ...e2]);
    }
    toString() {
        return `${this.symbol}+`;
    }
}

export function many1(symbol) {
    return new Many1Rule(symbol);
}

class OptionalRule extends Rule {
    constructor(symbol) {
        super();
        this.symbol = symbol;
        this.def([], () => null);
        this.def([symbol], ([e1]) => e1);
    }
    toString() {
        return `${this.symbol}?`;
    }
}

export function optional(symbol) {
    return new OptionalRule(symbol);
}

class ChoiceRule extends Rule {
    constructor(symbols) {
        super();
        this.symbols = symbols;
        for (let symbol of symbols) {
            this.def([symbol], ([e1]) => e1);
        }
    }
    toString() {
        return `( ${this.symbols.join(' | ')} )`;
    }
}

export function choice(...symbols) {
    return new ChoiceRule(symbols);
}

class SepByRule extends Rule {
    constructor(symbol, sepSymbol) {
        super();
        this.symbol = symbol;
        this.sepSymbol = sepSymbol;
        this.def([
            symbol,
            many(bind([sepSymbol, symbol], ([e1, e2]) => e2))
        ], ([e1, e2]) => [e1, ...e2]);
    }
    toString() {
        return `( ${this.symbol} % ${this.sepSymbol} )`;
    }
}

export function sepBy(symbol, sepSymbol) {
    return new SepByRule(symbol, sepSymbol);
}

export function times(min, max = min) {
    // TODO:
}

//endregion

export function defineGrammar() {
    let name;
    let func;
    if (arguments.length <= 1) {
        func = arguments[0];
    } else {
        name = arguments[0];
        func = arguments[1];
    }
    let grammar = new Grammar(name);
    currentGrammar = grammar;
    func();
    def(START, [grammar.start]);
    currentGrammar = null;
    return grammar;
}
