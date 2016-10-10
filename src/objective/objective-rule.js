export class ObjectiveRule{
    name;

    constructor(name){
        this.name = name;
    }

    // oblicza skumulowany payoff
    computePayoff(node, payoff=0){
        throw 'computePayoff function not implemented for rule: '+this.name
    }

    // koloruje optymalne ścieżki
    computeOptimal(node){
        throw 'computeOptimal function not implemented for rule: '+this.name
    }

}
