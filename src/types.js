import {Record, Set, Map} from 'immutable';
export /*internal*/ const START = Symbol();

let currentGrammar = null;
let currentGrammarStartId = null;

export /*internal*/ class Ref extends Record({id: null}) {
    constructor(id) {
        super({id: id});
    }
    toString() {
        // TODO: support Symbol polyfill.
        let name = this.id;
        if (typeof name === 'symbol') {
            name = '*';
        }
        return `<${name}>`;
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


// I do not like to use new keyword. But there is no easy way for now.
export class Path extends Record({production: null, cursor: null}) {
    constructor(production, cursor) {
        super({production, cursor});
    }
    get currentSymbol() {
        return this.production.symbols[this.cursor];
    }
    get atEnd() {
        return this.cursor === this.production.symbols.length;
    }
    toString() {
        let buffer = this.production.symbols.slice(0);
        buffer.splice(this.cursor, 0, '•');
        let name = this.production.id;
        if (typeof name === 'symbol') {
            name = '*';
        }
        return `${name} → ${buffer.join(' ')}`;
    }
}

export class State {
    constructor(id) {
        this.id = id;
        this.pathSet = Set();
        this.shiftMap = Map();
        this.reduceSet = Set();
    }
    toString() {
        return `State(${this.id}) ${this.pathSet.toString()}`;
    }
}
