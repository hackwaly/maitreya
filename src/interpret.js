import {START, Ref} from './types';
import preprocess from './preprocess';
import {Map, Set, Record, Stack} from 'immutable';

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
            let data = this.result.slice(-symbols.length);
            this.result.length -= symbols.length;
            if (action !== null) {
                data = action(data);
            }
            this.stack.length -= symbols.length;
            this.next(new Ref(production.id), data);
        }
    }
    next(input, data) {
        let state = this.stack[this.stack.length - 1];
        this.result.push(input instanceof Ref ? data : input);
        if (input instanceof Ref && input.id === START) {
            return;
        }
        let nextState = state.shiftMap.get(input);
        this.stack.push(nextState);
        this.reduce();
    }
    feed(stream) {
        for (let input of stream) {
            this.next(input);
        }
    }
}

const StateAndReduce = Record({state: null, reduce: null});

export class GLRParser {
    constructor(grammar) {
        this.grammar = grammar;
        let startState = preprocess(grammar);
        this.stackToResultMap = Map([[Stack([startState]), []]]);
        this.results = [];
        this.reduce();
    }
    reduce() {
        let stackToResultMap = this.stackToResultMap;
        let newStackToResultMap = Map().asMutable();
        let setOfCheckedStateAndReduce = Set().asMutable();
        let stackReduce = (stack, result) => {
            let state = stack.first();
            for (let production of state.reduceSet) {
                let stateAndReduce = StateAndReduce({state: state, reduce: production});
                if (setOfCheckedStateAndReduce.has(stateAndReduce)) {
                    continue;
                }
                setOfCheckedStateAndReduce.add(stateAndReduce);
                let {symbols, action} = production;
                let data = symbols.length <= 0 ? [] : result.slice(-symbols.length);
                let newResult = symbols.length <= 0 ? result.slice(0) : result.slice(0, -symbols.length);
                if (action !== null) {
                    data = action(data);
                }
                let newStack = stack.skip(symbols.length);
                let nexted = this.stackNext(newStack, newResult, new Ref(production.id), data);
                if (nexted !== null) {
                    newStackToResultMap.set(nexted.stack, nexted.result);
                    stackReduce(nexted.stack, nexted.result);
                }
            }
        };
        for (let stack of stackToResultMap.keys()) {
            let result = stackToResultMap.get(stack);
            newStackToResultMap.set(stack, result);
            stackReduce(stack, result);
        }
        this.stackToResultMap = newStackToResultMap;
    }
    stackNext(stack, result, input, data) {
        let state = stack.first();
        let newResult = result.slice(0);
        if (input instanceof Ref && input.id === START) {
            this.results.push(data[0]);
            return null;
        }
        newResult.push(input instanceof Ref ? data : input);
        if (!state.shiftMap.has(input)) {
            return null;
        }
        let newState = state.shiftMap.get(input);
        let newStack = stack.unshift(newState);
        return {
            stack: newStack,
            result: newResult
        };
    }
    next(input) {
        let stackToResultMap = this.stackToResultMap;
        let newStackToResultMap = Map().asMutable();
        for (let stack of stackToResultMap.keys()) {
            let result = stackToResultMap.get(stack);
            let nexted = this.stackNext(stack, result, input);
            if (nexted !== null) {
                newStackToResultMap.set(nexted.stack, nexted.result);
            }
        }
        this.stackToResultMap = newStackToResultMap;
        this.reduce();
    }
    feed(stream) {
        for (let input of stream) {
            this.results = [];
            this.next(input);
        }
    }
}