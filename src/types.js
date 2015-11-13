export /*internal*/ const START = Symbol();

let currentGrammar = null;
let currentGrammarStartId = null;

export /*internal*/ class Ref {
    constructor(id) {
        this.id = id;
    }
}

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
    return new Ref(id);
}

//region { Utilities }

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

export function sepBy() {
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
