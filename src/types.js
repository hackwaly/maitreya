import {Record, Set, Map} from 'immutable';

export const START = Symbol();

export class Nonterminal extends Record({id: null}) {
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

export class Grammar {
    constructor(name = null) {
        this.name = name;
        this.productions = Object.create(null);
        this.startId = null;
        this.allIds = [];
    }
    toString() {
        let head = this.name !== null ? `Grammar(${this.name})` : 'Grammar';
        let productions = [];
        for (let id of this.allIds) {
            for (let production of this.productions[id]) {
                productions.push(production);
            }
        }
        return `${head} { ${productions.join('; ')} }`;
    }
}

export class Production {
    constructor(id, symbols, action = null) {
        this.id = id;
        this.symbols = symbols;
        this.action = action;
    }
    toString() {
        let name = this.id;
        if (typeof name === 'symbol') {
            name = '*';
        }
        return `${name} → ${this.symbols.join(' ')}`;
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
