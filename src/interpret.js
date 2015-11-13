import {START, Ref} from './types';
import preprocess from './preprocess';

export class LR0Parser {
    constructor(grammar) {
        this.grammar = grammar;
        let startState = preprocess(grammar);
        this.stack = [startState];
        this.result = [];
        this.reduce();
    }
    reduce() {
        let state = this.stack[this.stack.length - 1];
        if (!state.reduceSet.isEmpty()) {
            let production = state.reduceSet.first();
            let {symbols, action} = production;
            let result = this.result.slice(-symbols.length);
            this.result.length -= symbols.length;
            if (action !== null) {
                result = action(result);
            }
            this.stack.length -= symbols.length;
            this.next(new Ref(production.id), result);
        }
    }
    next(input, result) {
        let state = this.stack[this.stack.length - 1];
        this.result.push(input instanceof Ref ? result : input);
        if (input instanceof Ref && input.id === START) {
            return;
        }
        let nextState = state.shiftMap.get(input);
        this.stack.push(nextState);
        // Nonterminal result is pushed in this.reduce() before.
        this.reduce();
    }
    feed(stream) {
        for (let input of stream) {
            this.next(input);
        }
    }
}
