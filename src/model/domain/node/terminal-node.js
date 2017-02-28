import {Node} from './node'

export class TerminalNode extends Node{

    static $TYPE = 'terminal';

    constructor(location){
        super(TerminalNode.$TYPE, location);
    }
}
