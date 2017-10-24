module.exports = function (config) {
    config.set({
        frameworks: ['jasmine'],
        plugins: [
            'karma-chrome-launcher',
            'karma-jasmine'
        ],
        files:[
            'node_modules/jquery/dist/jquery.js',
            'node_modules/jasmine-jquery/lib/jasmine-jquery.js',
            'dist/silver-decisions-vendor.js',
            'dist/silver-decisions-core.js',
            'dist/silver-decisions.js',
            'test/*.js',
            // JSON fixture
            { pattern:  'test/tree-json-filelist.json',
                watched:  true,
                served:   true,
                included: false },
            { pattern:  'test/trees/*.json',
                watched:  true,
                served:   true,
                included: false }
        ],
        // start these browsers
        browsers: ['Chrome'],
        reporters: ['progress'],
        logLevel: config.LOG_WARN,
        singleRun: false
    });
};
