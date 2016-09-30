import {Utils} from '../utils'

export class Edge {
    parentNode;
    childNode;

    name='';
    probability=0;
    payoff=0;

    $id = Utils.guid();

    constructor(parentNode, childNode, name,payoff, probability, ){
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