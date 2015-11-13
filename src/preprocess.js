import {Ref, START} from './types';
import {Map, Set, Record} from 'immutable';

// I do not like to use new keyword. But there is no easy way for now.
class Path extends Record({production: null, cursor: null}) {
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
        let buffer = [];
        let symbols = this.production.symbols;
        for (let i = 0; i < symbols.length; i++) {
            if (i === this.cursor) {
                buffer.push('•');
            }
            buffer.push(symbols[i]);
        }
        let name = this.production.id;
        if (typeof name === 'symbol') {
            name = '*';
        }
        return `${name} → ${buffer.join(' ')}`;
    }
}

export default function preprocess(grammar) {
    function expand(path) {
        let pathSet = Set([path]);
        if (path.atEnd) {
            return pathSet;
        }
        let symbol = path.currentSymbol;
        if (symbol instanceof Ref) {
            for (let production of grammar[symbol.id]) {
                pathSet = pathSet.union(expand(new Path(production, 0)));
            }
        }
        return pathSet;
    }

    let startPath = new Path(grammar[START][0], 0);
    let startState = expand(startPath);
    let stack = [startState];

    let shiftTable = Map().asMutable();
    let reduceTable = Map().asMutable();

    function walk(state) {
        let symbolToNextStateMap = Map().asMutable();
        let reduceSet = Set().asMutable();

        for (let path of state) {
            if (path.atEnd) {
                reduceSet.add(path.production);
            } else {
                let symbol = path.currentSymbol;
                let nextPathSet = Set();
                if (symbolToNextStateMap.has(symbol)) {
                    nextPathSet = symbolToNextStateMap.get(symbol);
                }
                let nextPath = new Path(path.production, path.cursor + 1);
                nextPathSet = nextPathSet.union(expand(nextPath));
                symbolToNextStateMap.set(symbol, nextPathSet);
            }
        }

        if (reduceSet.size > 0) {
            reduceTable.set(state, reduceSet.asImmutable());
        }
        shiftTable.set(state, symbolToNextStateMap.asImmutable());

        for (let nextState of symbolToNextStateMap.values()) {
            stack.push(nextState);
        }
    }

    while (stack.length > 0) {
        walk(stack.pop());
    }

    return {
        startState,
        shiftTable: shiftTable.asImmutable(),
        reduceTable: reduceTable.asImmutable()
    };
}
