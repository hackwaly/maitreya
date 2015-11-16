import {START, ANY, Reject, Nonterminal} from './types';
import preprocess from './preprocess';
import {Map, Set, Record, Stack} from 'immutable';

class ParserBase {
    constructor(grammar, tokenToSymbol = null) {
        this.grammar = grammar;
        this.tokenToSymbol = tokenToSymbol;
    }
    next(symbol, data) {}
    feed(stream) {
        for (let token of stream) {
            let symbol = this.tokenToSymbol !== null ?
                (this.tokenToSymbol)(token) : token;
            this.next(symbol, token);
        }
    }
}

const ReduceTry = Record({stack: null, reduce: null});

export class GLRParser extends ParserBase {
    constructor(grammar, tokenToSymbol) {
        super(grammar, tokenToSymbol);
        this.grammar = grammar;
        let startState = preprocess(grammar);
        this.index = 0;
        this.stackToResultMap = Map([[Stack([startState]), []]]);
        this.results = [];
        this.errors = [];
        this.reduce();
    }
    reduce() {
        let stackToResultMap = this.stackToResultMap;
        if (stackToResultMap.size === 0) {
            return;
        }

        let newStackToResultMap = Map().asMutable();
        let failedReduceTrySet = Set().asMutable();
        let errors = [];

        let stackReduce = (stack, result) => {
            let state = stack.first();
            for (let production of state.reduceSet) {
                let reduceTry = ReduceTry({state: state, reduce: production});
                if (failedReduceTrySet.has(reduceTry)) {
                    continue;
                }
                let {symbols, action} = production;
                let data = symbols.length <= 0 ? [] : result.slice(-symbols.length);
                if (action !== null) {
                    data = action(data, this.index);
                }
                if (data instanceof Reject) {
                    errors.push(data);
                    failedReduceTrySet.add(reduceTry);
                } else {
                    let newResult = symbols.length <= 0 ? result.slice(0) : result.slice(0, -symbols.length);
                    let newStack = stack.skip(symbols.length);
                    let nexted = this.stackNext(newStack, newResult, production.nonterminal, data);
                    if (nexted !== null) {
                        newStackToResultMap.set(nexted.stack, nexted.result);
                        stackReduce(nexted.stack, nexted.result);
                    } else {
                        failedReduceTrySet.add(reduceTry);
                    }
                }
            }
        };

        for (let stack of stackToResultMap.keys()) {
            let result = stackToResultMap.get(stack);
            newStackToResultMap.set(stack, result);
            stackReduce(stack, result);
        }

        this.stackToResultMap = newStackToResultMap;
        if (this.stackToResultMap.size === 0) {
            this.errors = errors;
        }
    }
    stackNext(stack, result, symbol, data) {
        let state = stack.first();
        let newResult = result.slice(0);
        let isNonterminal = symbol instanceof Nonterminal;
        if (isNonterminal && symbol.id === START) {
            this.results.push(data[0]);
            return null;
        }
        newResult.push(data);
        let newState;
        if (state.shiftMap.has(symbol)) {
            newState = state.shiftMap.get(symbol);
        } else if (!isNonterminal && state.shiftMap.has(ANY)) {
            newState = state.shiftMap.get(ANY);
        } else {
            return null;
        }
        let newStack = stack.unshift(newState);
        return {
            stack: newStack,
            result: newResult
        };
    }
    next(symbol, data) {
        this.index ++;
        this.results = [];

        let stackToResultMap = this.stackToResultMap;
        if (stackToResultMap.size === 0) {
            return;
        }

        let newStackToResultMap = Map().asMutable();
        for (let stack of stackToResultMap.keys()) {
            let result = stackToResultMap.get(stack);
            let nexted = this.stackNext(stack, result, symbol, data);
            if (nexted !== null) {
                newStackToResultMap.set(nexted.stack, nexted.result);
            }
        }
        this.stackToResultMap = newStackToResultMap;
        this.reduce();
    }
}
