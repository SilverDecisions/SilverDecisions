import {ObjectWithComputedValues} from './object-with-computed-values'

export class Edge extends ObjectWithComputedValues{
    parentNode;
    childNode;

    name='';
    probability=undefined;
    payoff=0;

    $DISPLAY_VALUE_NAMES = ['probability', 'payoff', 'optimal'];

    constructor(parentNode, childNode, name,payoff, probability, ){
        super();
        this.parentNode = parentNode;
        this.childNode = childNode;

        if(name!==undefined){
            this.name = name;
        }
        if(probability!==undefined){
            this.probability=probability;
        }
        if(payoff!==undefined){
            this.payoff=payoff
        }

    }

    setName(name){
        this.name = name;
        return this;
    }

    setProbability(probability){
        this.probability = probability;
        return this;
    }

    setPayoff(payoff){
        this.payoff = payoff;
        return this;
    }

    computedBaseProbability(val){
        return this.computedValue(null, 'probability', val);
    }

    computedBasePayoff(val){
        return this.computedValue(null, 'payoff', val);
    }

    displayProbability(val){
        return this.displayValue('probability', val);
    }

    displayPayoff(val){
        return this.displayValue('payoff', val);
    }
}
