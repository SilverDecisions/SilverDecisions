import {Node} from './node'
import * as d3 from '../../d3'

export class ChanceNode extends Node{

    static $TYPE = 'chance';

    constructor(location){
        super(ChanceNode.$TYPE, d3.symbolCircle, location);
    }
}
