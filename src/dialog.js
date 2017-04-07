import * as d3 from './d3'
import {i18n} from './i18n/i18n'

import {Utils} from 'sd-utils'

export class Dialog{

    app;

    container;

    constructor(container,app){
        this.app = app;
        this.container=container;
        this.container.select('.sd-close-modal').on('click', ()=>this.close());
        this.container.select('.sd-extend-modal').on('click', ()=>this.extend());
        this.container.select('.sd-shrink-modal').on('click', ()=>this.shrink());
    }

    open(){
        this.onOpen();
        this.container.classed('open', true);
    }
    close(){
        this.container.classed('open', false);
        this.onClosed();
    }

    extend(){
        this.container.classed('sd-full-screen', true);
    }

    shrink(){
        this.container.classed('sd-full-screen', false);
    }

    isVisible(){
        return this.container.classed('open');
    }

    onClosed(){

    }

    onOpen(){

    }
}
