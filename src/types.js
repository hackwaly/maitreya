import {Record, Set, Map} from 'immutable';

export const START = Symbol();
export const ANY = {
    toString() {
        return '#any';
    }
};

export class Reject {
    constructor(error) {
        this.error = error;
    }
}

export class Nonterminal extends Record({id: null}) {
    constructor(id) {
        super({id: id});
        this.productions = [];
    }
    toString() {
        return `<${this.id}>`;
    }
}

export class Grammar {
    constructor(name = null) {
        this.name = name;
        this.nonterminals = Object.create(null);
        this.start = null;
    }
    toString() {

    }
}

export class Production {
    constructor(nonterminal, symbols, action = null) {
        this.nonterminal = nonterminal;
        this.symbols = symbols;
        this.action = action;
    }
    toString() {
        return `${this.nonterminal.id} → ${this.symbols.join(' ')}`;
    }
}

// I do not like to use new keyword. But there is no easy way for now.
export class Path extends Record({production: null, cursor: null}) {
    constructor(production, cursor) {
        super({production, cursor});
    }
    get currentSymbol() {
        return this.production.symbols[this.cursor];
    }
    get atStart() {
        return this.cursor === 0;
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
        return `State(${this.id}) ${this.pathSet.toString().slice(4)}`;
    }
}
