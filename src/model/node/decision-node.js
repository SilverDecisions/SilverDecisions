import {Node} from './node'
import * as d3 from '../../d3'

export class DecisionNode extends Node{

    static $TYPE = 'decision';

    constructor(location){
        super(DecisionNode.$TYPE, d3.symbolSquare, location);
    }
}
