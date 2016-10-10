import {ObjectWithIdAndComputedValues} from './object-with-id-and-computed-values'

export class Edge extends ObjectWithIdAndComputedValues{
    parentNode;
    childNode;

    name='';
    probability=0;
    payoff=0;

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
}
