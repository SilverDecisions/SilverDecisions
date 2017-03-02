export class JobWorker{

    worker;
    listeners = {};
    defaultListener;

    constructor(url, defaultListener, onError){
        var instance = this;
        this.worker = new Worker(url);
        this.defaultListener = defaultListener || function() {};
        if (onError) {this.worker.onerror = onError;}

        this.worker.onmessage = function(event) {
            if (event.data instanceof Object &&
                event.data.hasOwnProperty('queryMethodListener') && event.data.hasOwnProperty('queryMethodArguments')) {
                var listener = instance.listeners[event.data.queryMethodListener];
                var args = event.data.queryMethodArguments;
                if(listener.deserializer){
                    args = listener.deserializer(args);
                }
                listener.fn.apply(listener.thisArg, args);
            } else {
                this.defaultListener.call(instance, event.data);
            }
        }

    }

    sendQuery() {
        if (arguments.length < 1) {
            throw new TypeError('JobWorker.sendQuery takes at least one argument');
        }
        this.worker.postMessage({
            'queryMethod': arguments[0],
            'queryArguments': Array.prototype.slice.call(arguments, 1)
        });
    }

    runJob(jobName, jobParametersValues, dataDTO){
        this.sendQuery('runJob', jobName, jobParametersValues, dataDTO)
    }

    executeJob(jobExecutionId){
        this.sendQuery('executeJob', jobExecutionId)
    }

    postMessage(message) {
        this.worker.postMessage(message);
    }

    terminate() {
        this.worker.terminate();
    }

    addListener(name, listener, thisArg, deserializer) {
        this.listeners[name] = {
            fn: listener,
            thisArg: thisArg || this,
            deserializer: deserializer
        };
    }

    removeListener(name) {
        delete this.listeners[name];
    }
}
