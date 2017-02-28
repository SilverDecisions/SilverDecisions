import {Node} from './node'

export class DecisionNode extends Node{

    static $TYPE = 'decision';

    constructor(location){
        super(DecisionNode.$TYPE, location);
    }
}
