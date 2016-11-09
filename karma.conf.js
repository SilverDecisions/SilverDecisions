module.exports = function (config) {
    config.set({
        frameworks: ['jasmine'],
        plugins: [
            'karma-phantomjs-launcher',
            'karma-chrome-launcher',
            'karma-jasmine'
        ],
        files:[
            'dist/silver-decisions.js',
            'test/*.js'
        ],
        // start these browsers
        browsers: ['Chrome'],
        reporters: ['progress'],
        logLevel: config.LOG_WARN,
        singleRun: false
    });
};
