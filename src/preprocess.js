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
}

export default function preprocess(grammar) {
    let startState = Set([new Path(grammar[START][0], 0)]);

    let shiftTable = Map().asMutable();
    let reduceTable = Map().asMutable();

    let stack = [startState];

    function walk(state) {
        let symbolToNextStateMap = Map().asMutable();
        let reduceSet = Set().asMutable();

        for (let path of state) {
            if (path.atEnd) {
                reduceSet.add(path.production.id);
            } else {
                let symbol = path.currentSymbol;
                let nextPathSet = Set();
                if (symbolToNextStateMap.has(symbol)) {
                    nextPathSet = symbolToNextStateMap.get(symbol);
                }
                nextPathSet = nextPathSet.add(new Path(path.production, path.cursor + 1));
                symbolToNextStateMap.set(symbol, nextPathSet);
            }
        }

        reduceTable.set(state, reduceSet.asImmutable());
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
