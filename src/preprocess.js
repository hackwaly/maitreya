import {Nonterminal, START, ANY, Path, State} from './types';
import {Map, Set, Record} from 'immutable';

export default function preprocess(grammar) {
    let nextStateId = 0;
    let pathSetToStateMap = Map().asMutable();

    function expand(path) {
        let walkedNonterminalSet = Set().asMutable();
        function walk(path) {
            let pathSet = Set([path]);
            if (path.atEnd) {
                return pathSet;
            }
            let symbol = path.currentSymbol;
            if (symbol instanceof Nonterminal && !walkedNonterminalSet.has(symbol)) {
                walkedNonterminalSet.add(symbol);
                for (let production of grammar.productions[symbol.id]) {
                    pathSet = pathSet.union(walk(new Path(production, 0)));
                }
            }
            return pathSet;
        }
        return walk(path);
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

    let startPath = new Path(grammar.productions[START][0], 0);
    let startState = pathSetToState(expand(startPath));
    let stack = [startState];

    let walkedStates = Set().asMutable();

    function walk(state) {
        if (walkedStates.has(state)) {
            return;
        }
        walkedStates.add(state);

        let symbolToPathSet = Map().asMutable();
        let anySymbolPathSet = Set().asMutable();
        let reduceSet = Set().asMutable();

        for (let path of state.pathSet) {
            if (path.atEnd) {
                reduceSet.add(path.production);
            } else {
                let symbol = path.currentSymbol;
                let nextPath = new Path(path.production, path.cursor + 1);
                if (symbol === ANY) {
                    anySymbolPathSet.union(expand(nextPath));
                } else {
                    let nextPathSet = Set();
                    if (symbolToPathSet.has(symbol)) {
                        nextPathSet = symbolToPathSet.get(symbol);
                    }
                    nextPathSet = nextPathSet.union(expand(nextPath));
                    symbolToPathSet.set(symbol, nextPathSet);
                }
            }
        }
        state.reduceSet = reduceSet.asImmutable();
        let shiftMap = Map().asMutable();

        anySymbolPathSet = anySymbolPathSet.asImmutable();

        for (let symbol of symbolToPathSet.keys()) {
            let pathSet = symbolToPathSet.get(symbol);
            if (!(symbol instanceof Nonterminal)) {
                pathSet = pathSet.union(anySymbolPathSet);
            }
            let nextState = pathSetToState(pathSet);
            shiftMap.set(symbol, nextState);
            stack.push(nextState);
        }

        if (anySymbolPathSet.size > 0) {
            let anyNextState = pathSetToState(anySymbolPathSet);
            shiftMap.set(ANY, anyNextState);
            stack.push(anyNextState);
        }

        state.shiftMap = shiftMap.asImmutable();
    }

    while (stack.length > 0) {
        walk(stack.pop());
    }

    return startState;
}
