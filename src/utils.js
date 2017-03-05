import * as _ from "lodash";

export class Utils {
    static SQRT_2 = 1.41421356237;
    // usage example deepExtend({}, objA, objB); => should work similar to $.extend(true, {}, objA, objB);
    static deepExtend(out) {

        var utils = this;
        var emptyOut = {};


        if (!out && arguments.length > 1 && Array.isArray(arguments[1])) {
            out = [];
        }
        out = out || {};

        for (var i = 1; i < arguments.length; i++) {
            var source = arguments[i];
            if (!source)
                continue;

            for (var key in source) {
                if (!source.hasOwnProperty(key)) {
                    continue;
                }
                var isArray = Array.isArray(out[key]);
                var isObject = utils.isObject(out[key]);
                var srcObj = utils.isObject(source[key]);

                if (isObject && !isArray && srcObj) {
                    utils.deepExtend(out[key], source[key]);
                } else {
                    out[key] = source[key];
                }
            }
        }

        return out;
    };

    static extend (a, b) {
        var n;
        if (!a) {
            a = {};
        }
        for (n in b) {
            a[n] = b[n];
        }
        return a;
    };

    static mergeDeep(target, source) {
        let output = Object.assign({}, target);
        if (Utils.isObjectNotArray(target) && Utils.isObjectNotArray(source)) {
            Object.keys(source).forEach(key => {
                if (Utils.isObjectNotArray(source[key])) {
                    if (!(key in target))
                        Object.assign(output, {[key]: source[key]});
                    else
                        output[key] = Utils.mergeDeep(target[key], source[key]);
                } else {
                    Object.assign(output, {[key]: source[key]});
                }
            });
        }
        return output;
    }

    static getVariablesAsList(scope){
        var result = [];
        _.forOwn(scope, function(value, key) {
            if(Utils.isFunction(value)){
                return;
                // value = value.syntax;
            }
            result.push({
                key: key,
                value: value
            })

        });

        return result;
    }

    static cross(a, b) {
        var c = [], n = a.length, m = b.length, i, j;
        for (i = -1; ++i < n;) for (j = -1; ++j < m;) c.push({x: a[i], i: i, y: b[j], j: j});
        return c;
    };

    static isObjectNotArray(item) {
        return (item && typeof item === 'object' && !Array.isArray(item) && item !== null);
    };

    static isArray(item) {
        return Array.isArray(item);
    };

    static isObject(a) {
        return a !== null && typeof a === 'object';
    };

    static isNumber(a) {
        return !isNaN(a) && typeof a === 'number';
    };

    static  isNumeric(n) {
        return !isNaN(parseFloat(n)) && isFinite(n);
    }

    static isInt(n){
        return Utils.isNumber(n) && n % 1 === 0;
    }

    static isFunction(a) {
        return typeof a === 'function';
    };

    static isDate(a) {
        return Object.prototype.toString.call(a) === '[object Date]'
    }

    static isString(a) {
        return typeof a === 'string' || a instanceof String
    }

    static guid() {
        function s4() {
            return Math.floor((1 + Math.random()) * 0x10000)
                .toString(16)
                .substring(1);
        }

        return s4() + s4() + '-' + s4() + '-' + s4() + '-' +
            s4() + '-' + s4() + s4() + s4();
    }


    static capitalizeFirstLetter(string) {
        return string.charAt(0).toUpperCase() + string.slice(1);
    }

    static getObjectByIdMap(objectList, mappingFn) {
        var objectById = {};
        if (!objectList) {
            return objectById;
        }
        objectList.forEach(function (obj) {
            var val = obj;
            if (mappingFn) {
                val = mappingFn(obj);
            }
            objectById[obj.$id] = val;
        });
        return objectById;
    };


    static timers = {};
    static waitForFinalEvent(callback, uniqueId, ms=50) {
        if (!uniqueId) {
            uniqueId = "Don't call this twice without a uniqueId";
        }
        if (Utils.timers[uniqueId]) {
            clearTimeout (Utils.timers[uniqueId]);
        }
        Utils.timers[uniqueId] = setTimeout(callback, ms);

        return () => clearTimeout (Utils.timers[uniqueId]);
    };

    /**
     * detect IE
     * returns version of IE or false, if browser is not Internet Explorer
     */
    static detectIE() {
        var ua = window.navigator.userAgent;
        var msie = ua.indexOf('MSIE ');
        if (msie > 0) {
            // IE 10 or older => return version number
            return parseInt(ua.substring(msie + 5, ua.indexOf('.', msie)), 10);
        }

        var trident = ua.indexOf('Trident/');
        if (trident > 0) {
            // IE 11 => return version number
            var rv = ua.indexOf('rv:');
            return parseInt(ua.substring(rv + 3, ua.indexOf('.', rv)), 10);
        }

        /*var edge = ua.indexOf('Edge/');
         if (edge > 0) {
         // Edge (IE 12+) => return version number
         return parseInt(ua.substring(edge + 5, ua.indexOf('.', edge)), 10);
         }*/

        // other browser
        return false;
    }

    static stripNumberToPrec(num, prec=12){
        return parseFloat(parseFloat(num).toPrecision(prec));
    }

    static getGlobalObject(){
        return (function () {
            if (typeof self !== 'undefined') { return self; }
            if (typeof window !== 'undefined') { return window; }
            if (typeof global !== 'undefined') { return global; }

            // When running tests none of the above have been defined
            return {};
        })();
    }

    static isWorker(){
        var global = Utils.getGlobalObject();
        return !global.document && !!global.postMessage;
    }

    static stringify(obj, replacer, filteredPrefixes = ['$']){
        var cache = [];
        return JSON.stringify(obj, function (k, v) {
            if (typeof v === 'object' && v !== null) {
                if (cache.indexOf(v) !== -1) {
                    // Circular reference found, discard key
                    return;
                }
                cache.push(v);
            }

            if(filteredPrefixes){
                if(filteredPrefixes.some(prefix=>_.startsWith(k, prefix))){
                    return undefined;
                }
            }

            if(replacer){
                if(!Utils.isArray(replacer)){
                    return replacer(k, v);
                }

                replacer.forEach(r=>{
                    v = r(k,v);
                })

            }
            return v;

        }, 2);

    }

    static  compareVersionNumbers(v1, v2) {
        var v1parts = v1.split('.');
        var v2parts = v2.split('.');

        function validateParts(parts) {
            for (var i = 0; i < parts.length; ++i) {
                if (!Utils.isPositiveInteger(parts[i])) {
                    return false;
                }
            }
            return true;
        }

        if (!validateParts(v1parts) || !validateParts(v2parts)) {
            return NaN;
        }

        for (var i = 0; i < v1parts.length; ++i) {
            if (v2parts.length === i) {
                return 1;
            }

            if (v1parts[i] === v2parts[i]) {
                continue;
            }
            if (v1parts[i] > v2parts[i]) {
                return 1;
            }
            return -1;
        }

        if (v1parts.length != v2parts.length) {
            return -1;
        }

        return 0;
    }

    static isPositiveInteger(x) {
        return /^\d+$/.test(x);
    }

    static versionRegexp = /^([0-9]+)\.([0-9]+)\.([0-9]+)$/;

    static isValidVersionString(ver) {
        if (!Utils.isString(ver)) {
            return false;
        }
        return Utils.versionRegexp.test(ver)
    }

    static makeIterator(array) {
        var nextIndex = 0;

        return {
            next: function() {
                return nextIndex < array.length ?
                {value: array[nextIndex++], done: false} :
                {done: true};
            }
        };
    }

    static isUnique(array, accesor){
        return array.length === new Set(array.map(accesor)).size;
    }

    static getErrorDTO(e){
        return {
            name: e.constructor.name,
            message: e.message
        }
    }
}
