import {START, Nonterminal} from './types';
import preprocess from './preprocess';
import {Map, Set, Record, Stack} from 'immutable';

class ParserBase {
    constructor(grammar, tokenToSymbol = null) {
        this.grammar = grammar;
        this.tokenToSymbol = tokenToSymbol;
    }
    next(symbol) {}
    feed(input) {
        for (let token of input) {
            let symbol = this.tokenToSymbol !== null ?
                (this.tokenToSymbol)(token) : token;
            this.next(symbol);
        }
    }
}

export class LR0Parser extends ParserBase {
    constructor(grammar, tokenToSymbol) {
        super(grammar, tokenToSymbol);
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
            this.next(new Nonterminal(production.id), data);
        }
    }
    next(symbol, data) {
        let state = this.stack[this.stack.length - 1];
        this.result.push(symbol instanceof Nonterminal ? data : symbol);
        if (symbol instanceof Nonterminal && symbol.id === START) {
            return;
        }
        let nextState = state.shiftMap.get(symbol);
        this.stack.push(nextState);
        this.reduce();
    }
}

// FIXME: The commented code makes test failed.
/*
const StateAndReduce = Record({state: null, reduce: null});
*/

export class GLRParser extends ParserBase {
    constructor(grammar, tokenToSymbol) {
        super(grammar, tokenToSymbol);
        this.grammar = grammar;
        let startState = preprocess(grammar);
        this.stackToResultMap = Map([[Stack([startState]), []]]);
        this.results = [];
        this.reduce();
    }
    reduce() {
        let stackToResultMap = this.stackToResultMap;
        let newStackToResultMap = Map().asMutable();
        /*
        let setOfCheckedStateAndReduce = Set().asMutable();
        */
        let stackReduce = (stack, result) => {
            let state = stack.first();
            newStackToResultMap.set(stack, result);
            for (let production of state.reduceSet) {
                /*
                let stateAndReduce = StateAndReduce({state: state, reduce: production});
                if (setOfCheckedStateAndReduce.has(stateAndReduce)) {
                    continue;
                }
                setOfCheckedStateAndReduce.add(stateAndReduce);
                */
                let {symbols, action} = production;
                let data = symbols.length <= 0 ? [] : result.slice(-symbols.length);
                let newResult = symbols.length <= 0 ? result.slice(0) : result.slice(0, -symbols.length);
                if (action !== null) {
                    data = action(data);
                }
                let newStack = stack.skip(symbols.length);
                let nexted = this.stackNext(newStack, newResult, new Nonterminal(production.id), data);
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
    stackNext(stack, result, symbol, data) {
        let state = stack.first();
        let newResult = result.slice(0);
        if (symbol instanceof Nonterminal && symbol.id === START) {
            this.results.push(data[0]);
            return null;
        }
        newResult.push(symbol instanceof Nonterminal ? data : symbol);
        if (!state.shiftMap.has(symbol)) {
            return null;
        }
        let newState = state.shiftMap.get(symbol);
        let newStack = stack.unshift(newState);
        return {
            stack: newStack,
            result: newResult
        };
    }
    next(symbol) {
        this.results = [];
        let stackToResultMap = this.stackToResultMap;
        let newStackToResultMap = Map().asMutable();
        for (let stack of stackToResultMap.keys()) {
            let result = stackToResultMap.get(stack);
            let nexted = this.stackNext(stack, result, symbol);
            if (nexted !== null) {
                newStackToResultMap.set(nexted.stack, nexted.result);
            }
        }
        this.stackToResultMap = newStackToResultMap;
        this.reduce();
    }
}