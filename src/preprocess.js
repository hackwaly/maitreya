import {Ref, START, Path, State} from './types';
import {Map, Set, Record} from 'immutable';

export default function preprocess(grammar) {
    let nextStateId = 0;
    let pathSetToStateMap = Map().asMutable();

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

    function pathSetToState(pathSet) {
        if (pathSetToStateMap.has(pathSet)) {
            return pathSetToStateMap.get(pathSet);
        }
        let state = new State(nextStateId++);
        state.pathSet = pathSet;
        pathSetToStateMap.set(pathSet, state);
        return state;
    }

    let startProduction = grammar[START][0];
    let startSymbol = startProduction.symbols[0];
    let startPath = new Path(startProduction, 0);
    let startState = pathSetToState(expand(startPath));
    let stack = [startState];

    let walkedStates = Set().asMutable();

    function walk(state) {
        if (walkedStates.has(state)) {
            return;
        }
        walkedStates.add(state);

        let symbolToPathSet = Map().asMutable();
        let reduceSet = Set().asMutable();

        for (let path of state.pathSet) {
            if (path.atEnd) {
                reduceSet.add(path.production);
            } else {
                let symbol = path.currentSymbol;
                let nextPathSet = Set();
                if (symbolToPathSet.has(symbol)) {
                    nextPathSet = symbolToPathSet.get(symbol);
                }
                let nextPath = new Path(path.production, path.cursor + 1);
                nextPathSet = nextPathSet.union(expand(nextPath));
                symbolToPathSet.set(symbol, nextPathSet);
            }
        }

        state.reduceSet = reduceSet.asImmutable();
        let shiftMap = Map().asMutable();
        for (let symbol of symbolToPathSet.keys()) {
            let pathSet = symbolToPathSet.get(symbol);
            let nextState = pathSetToState(pathSet);
            shiftMap.set(symbol, nextState);
            stack.push(nextState);
        }
        state.shiftMap = shiftMap.asImmutable();
    }

    while (stack.length > 0) {
        walk(stack.pop());
    }

    return startState;
}
