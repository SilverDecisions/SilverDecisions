import {Node} from './node'

export class ChanceNode extends Node{

    static $TYPE = 'chance';

    constructor(location){
        super(ChanceNode.$TYPE, location);
    }
}
