import {Utils} from './utils'
import * as math from './mathjs'

export class ExpressionEngine{

    constructor(scope){
        this.parser = math.parser();
        this.parser.scope = scope;

    }

    eval(expr){
        if(!isNaN(expr)){
            return ExpressionEngine.toNumber(expr);
        }

        return this.parser.eval(expr+"");
    }

    static add(a, b){
        return math.add(ExpressionEngine.toNumber(a), ExpressionEngine.toNumber(b));
    }

    evalAndAdd(a,b){
        return ExpressionEngine.add(this.eval(a),this.eval(b));
    }

    static subtract(a, b){
        return math.subtract(ExpressionEngine.toNumber(a), ExpressionEngine.toNumber(b));
    }

    static divide(a, b){
        return math.divide(ExpressionEngine.toNumber(a), ExpressionEngine.toNumber(b));
    }

    static multiply(a,b){
        return math.multiply(ExpressionEngine.toNumber(a), ExpressionEngine.toNumber(b));
    }

    evalAndMultiply(a,b){
        return ExpressionEngine.multiply(this.eval(a),this.eval(b));
    }

    static toNumber(a){
        return math.fraction(a);
    }

    static compare(a, b){
        return math.compare(ExpressionEngine.toNumber(a), ExpressionEngine.toNumber(b))
    }


    validate(expr){
        if(expr===null || expr===undefined){
            return false;
        }

        try{
            var c = math.compile(expr);
            var e = c.eval(this.parser.scope);
            return Utils.isNumeric(e);
        }catch (e){
            return false;
        }
    }

    serialize(v){
        return ExpressionEngine.toNumber(v).toFraction(true);
    }
}
