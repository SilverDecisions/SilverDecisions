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

    computeHash(edges){
        var hashCount=0;
        var probabilitySum=0;
        edges.forEach(e=>{
            if(ExpressionEngine.isHash(e.probability)){
                hashCount++;
                return;
            }

            probabilitySum = ExpressionEngine.add(probabilitySum, this.eval(e.probability));
        });
        if(!hashCount){
            return 0;
        }
        var hash = ExpressionEngine.divide(ExpressionEngine.subtract(1, probabilitySum), hashCount);
        return hash;
    }

    static isHash(expr){
        return expr && Utils.isString(expr) && expr.trim()==='#'
    }

    evalProbability(edge){
        if(!ExpressionEngine.isHash(edge.probability)){
            return this.eval(edge.probability);
        }
        return this.computeHash(edge.parentNode.childEdges);
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
