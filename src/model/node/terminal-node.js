import {Node} from './node'
import * as d3 from '../../d3'

export class TerminalNode extends Node{

    static $TYPE = 'terminal';

    constructor(location){
        super(TerminalNode.$TYPE, d3.symbolTriangle, location);
    }
}
