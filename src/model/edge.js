import {Utils} from '../utils'

export class Edge {
    parentNode;
    childNode;

    name='';
    probability=0;
    payoff=0;

    $id = Utils.guid();

    constructor(parentNode, childNode){
        this.parentNode = parentNode;
        this.childNode = childNode;
    }
}