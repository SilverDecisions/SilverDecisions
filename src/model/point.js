export class Point {
    x;
    y;
    constructor(x,y){
        this.x=x;
        this.y=y;
    }
    
    move(x,y){
        this.x+=x;
        this.y+=y;
    }
}