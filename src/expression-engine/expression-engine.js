import {Utils} from '../utils'
import * as math from './mathjs'
import * as _ from "lodash";
import * as log from "../log"

export class ExpressionEngine{

    constructor(){
        this.parser = math.parser();

    }

    setScope(scope){
        this.parser.scope = scope;
    }

    eval(expr, asNumber=true, scope){
        log.trace('eval: '+expr);
        expr+="";
        expr = expr.trim();
        if(asNumber){
            try{
                return ExpressionEngine.toNumber(expr);
            }catch(e){
                //   Left empty intentionally
            }
        }

        var prevScope = this.parser.scope;
        if(scope){
            this.setScope(scope);
        }
        var ev = this.parser.eval(expr+"");
        this.setScope(prevScope);
        if(!asNumber) {
            return ev;
        }
        return ExpressionEngine.toNumber(ev);
    }

    static isHash(expr){
        return expr && Utils.isString(expr) && expr.trim()==='#'
    }

    static hasAssignmentExpression(expr){
        return Utils.isString(expr)&&expr.indexOf('=')!==-1
    }


    evalPayoff(edge){
        if(ExpressionEngine.hasAssignmentExpression(edge.payoff)){
            return null;
        }
        return this.eval(edge.payoff, true, edge.parentNode.expressionScope);
    }

    static add(a, b){
        return math.add(ExpressionEngine.toNumber(a), ExpressionEngine.toNumber(b));
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

    static round(a, places){
        return ExpressionEngine.toNumber(a).round(places)
    }

    static toNumber(a){
        return math.fraction(a);
    }

    static compare(a, b){
        return math.compare(ExpressionEngine.toNumber(a), ExpressionEngine.toNumber(b))
    }


    validate(expr, scope, compileOnly=true){
        if(expr===null || expr===undefined){
            return false;
        }

        try{
            expr+="";
            expr = expr.trim();
            var c = math.compile(expr);

            if(compileOnly){
                return true;
            }
            if(!scope){
                scope =this.parser.scope;
            }

            var e = c.eval(scope);
            return Utils.isNumeric(e);
        }catch (e){
            return false;
        }
    }

    static isExpressionObject(v){
        return !!v.mathjs;
    }

    serialize(v){
        return ExpressionEngine.toNumber(v).toFraction(true);
    }

    getJsonReviver() {
        return math.json.reviver;
    }

    static format(val){
        return math.format(val);
    }
}
