import {Node} from './node'
import * as d3 from '../../d3'

export class TerminalNode extends Node{

    constructor(location){
        super('terminal', d3.symbolTriangle, location);
    }
}