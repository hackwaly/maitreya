import {START, Nonterminal} from './types';

let currentGrammar = null;
let currentGrammarStartId = null;

export function def(id, symbols, action = null) {
    let rule = currentGrammar[id];
    if (rule === undefined) {
        rule = [];
        currentGrammar[id] = rule;
    }
    rule.push({id, symbols, action});
    if (currentGrammarStartId === null) {
        currentGrammarStartId = id;
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

export function defineGrammar(func) {
    currentGrammar = Object.create(null);
    currentGrammarStartId = null;
    let startId = func();
    if (startId === undefined) {
        startId = currentGrammarStartId;
    }
    def(START, [ref(startId)]);
    let grammar = currentGrammar;
    currentGrammar = null;
    currentGrammarStartId = null;
    return grammar;
}
