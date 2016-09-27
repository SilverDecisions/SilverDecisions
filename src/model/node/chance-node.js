import {Node} from './node'
import * as d3 from '../../d3'

export class ChanceNode extends Node{

    constructor(location){
        super('chance', d3.symbolCircle, location);
    }
}