import {START, Ref} from './types';
import preprocess from './preprocess';

export class LR0Parser {
    constructor(grammar) {
        this.grammar = grammar;
        let {startState, shiftTable, reduceTable} = preprocess(grammar);
        this.startState = startState;
        this.shiftTable = shiftTable;
        this.reduceTable = reduceTable;
        this.stack = [startState];
        this.result = [];
        this.reduce();
    }
    reduce() {
        let state = this.stack.pop();
        if (this.reduceTable.has(state)) {
            let reduceSet = this.reduceTable.get(state);
            let production = reduceSet.first();
            if (production === this.grammar[START][0]) {
                this.result = this.stack[0];
            } else {
                let {symbols, action} = production;
                let result = this.result.slice(-symbols.length);
                this.result.length -= symbols.length;
                if (action !== null) {
                    result = action(result);
                }
                this.result.push(result);
            }
            this.next(new Ref(production.id));
        } else {
            this.stack.push(state);
        }
    }
    next(input) {
        let state = this.stack.pop();
        let nextTable = this.shiftTable.get(state);
        let nextState = nextTable.get(input);
        this.stack.push(state);
        this.result.push(input);
        this.reduce();
    }
    feed(stream) {
        for (let input of stream) {
            this.next(input);
        }
    }
}
