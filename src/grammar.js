import {START, Grammar, Nonterminal, Production} from './types';

let currentGrammar = null;

export function def(id, symbols, action) {
    let productions = currentGrammar.productions[id];
    if (productions === undefined) {
        productions = [];
        currentGrammar.productions[id] = productions;
        currentGrammar.allIds.push(id);
    }
    productions.push(new Production(id, symbols, action));
    if (currentGrammar.startId === null) {
        currentGrammar.startId = id;
    }
}

export function ref(id) {
    return new Nonterminal(id);
}

//region { Utilities }

// TODO: Use Immutable struct to deduplicate.

export function bind(symbols, action) {
    let anonymous = Symbol();
    def(anonymous, symbols, (es) => action(es));
    return ref(anonymous);
}

export function string(literal) {
    let anonymous = Symbol();
    def(anonymous, literal.split(''), (es) => es.join(''));
    return ref(anonymous);
}

export function many(symbol) {
    let anonymous = Symbol();
    def(anonymous, [], () => []);
    def(anonymous, [symbol, ref(anonymous)], ([e1, e2]) => [e1, ...e2]);
    return ref(anonymous);
}

export function many1(symbol) {
    let anonymous = Symbol();
    def(anonymous, [symbol, many(symbol)], ([e1, e2]) => [e1, ...e2]);
    return ref(anonymous);
}

export function optional(symbol) {
    let anonymous = Symbol();
    def(anonymous, [], () => null);
    def(anonymous, [symbol], ([e1]) => e1);
    return ref(anonymous);
}

export function choice(...symbols) {
    let anonymous = Symbol();
    for (let symbol of symbols) {
        def(anonymous, [symbol], ([e1]) => e1);
    }
    return ref(anonymous);
}

export function sepBy(symbol, sepSymbol) {
    let anonymous = Symbol();
    let tail = many(bind([sepSymbol, symbol], ([e1, e2]) => e2));
    def(anonymous, [symbol, tail], ([e1, e2]) => [e1, ...e2]);
    return ref(anonymous);
}

export function times(min, max = min) {
    // TODO:
}

//endregion

// Only for LR0.
export function eliminateLeftRecursive(grammar) {
    function classify(productions) {
        let recursived = [];
        let nonrecursived = [];
        let hasEpsilon = false;
        function checkLeftRecursive(production) {
            let symbols = production.symbols;
            if (symbols.length === 0) {
                hasEpsilon = true;
                return false;
            }
            let symbol = symbols[0];
            return symbol instanceof Nonterminal && symbol.id === production.id;
        }
        for (let production of productions) {
            if (checkLeftRecursive(production)) {
                recursived.push(production);
            } else {
                nonrecursived.push(production);
            }
        }
        return {recursived, nonrecursived, hasEpsilon};
    }

    // http://www.csd.uwo.ca/~moreno//CS447/Lectures/Syntax.html/node8.html
    function eliminate(id) {
        let productions = grammar.productions[id];
        let {recursived, nonrecursived, hasEpsilon} = classify(productions);
        if (recursived.length === 0) {
            return;
        }
        if (nonrecursived.length === 0 || (recursived.length > 0 && hasEpsilon)) {
            throw new Error('TODO: Error message');
        }
        // TODO: Give action.
        let anonymous = Symbol();
        grammar.productions[id] = nonrecursived.map((production) => {
            return new Production(id, [...production.symbols, ref(anonymous)]);
        });
        grammar.productions[anonymous] = [new Production(anonymous, []), ...recursived.map((production) => {
            return new Production(anonymous, [...production.symbols.slice(1), ref(anonymous)]);
        })];
        grammar.allIds.push(anonymous);
    }

    for (let id of grammar.allIds.slice(0)) {
        eliminate(id);
    }
}

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
    let startId = func();
    if (startId !== undefined) {
        grammar.startId = startId;
    }
    def(START, [ref(grammar.startId)]);
    currentGrammar = null;
    return grammar;
}
