import {Node} from './node'
import * as d3 from '../../d3'

export class DecisionNode extends Node{

    constructor(location){
        super('decision', d3.symbolSquare, location);
    }
}