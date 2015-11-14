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

export function bind(symbols, action) {
    let anonymous = Symbol();
    def(anonymous, symbols, (es) => action(es, Reject), true);
    return ref(anonymous);
}

export function string(literal) {
    let anonymous = Symbol();
    def(anonymous, literal.split(''), (es) => es.join(''), true);
    return ref(anonymous);
}

export function many(symbol) {
    let anonymous = Symbol();
    def(anonymous, [], () => [], true);
    def(anonymous, [symbol, ref(anonymous)], ([e1, e2]) => [e1, ...e2], true);
    return ref(anonymous);
}

export function many1(symbol) {
    let anonymous = Symbol();
    def(anonymous, [symbol, many(symbol)], ([e1, e2]) => [e1, ...e2], true);
    return ref(anonymous);
}

export function optional(symbol) {
    let anonymous = Symbol();
    def(anonymous, [], () => null, true);
    def(anonymous, [symbol], ([e1]) => e1, true);
    return ref(anonymous);
}

export function choice(...symbols) {
    let anonymous = Symbol();
    for (let symbol of symbols) {
        def(anonymous, [symbol], ([e1]) => e1, true);
    }
    return ref(anonymous);
}

export function sepBy(symbol, sepSymbol) {
    let anonymous = Symbol();
    let tail = many(bind([sepSymbol, symbol], ([e1, e2]) => e2));
    def(anonymous, [symbol, tail], ([e1, e2]) => [e1, ...e2], true);
    return ref(anonymous);
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
