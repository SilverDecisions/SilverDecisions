
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

    setFullScreen(fullScreen=true){
        let self = this;
        this.container.classed('sd-full-screen', fullScreen);
        setTimeout(function(){ self.onResized() }, 10)
    }

    extend(){
        this.setFullScreen();
    }

    shrink(){
        this.setFullScreen(false);
    }

    isVisible(){
        return this.container.classed('open');
    }

    onClosed(){

    }

    onOpen(){

    }

    onResized(){

    }
}
