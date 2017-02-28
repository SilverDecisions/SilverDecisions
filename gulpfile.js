var gulp = require('gulp');
var del = require('del');
var merge = require('merge-stream');
var plugins = require('gulp-load-plugins')();
var browserSync = require('browser-sync').create();
var argv = require('yargs').argv;

var browserify = require("browserify");
var source = require('vinyl-source-stream');
var sourcemaps = require('gulp-sourcemaps');
var buffer = require('vinyl-buffer');

var p = require('./package.json'),
stringify = require('stringify');

var Server = require('karma').Server;

/* nicer browserify errors */
var gutil = require('gulp-util')
var chalk = require('chalk')

var projectName= "silver-decisions"

gulp.task('clean', function (cb) {
    return del(['tmp', 'dist'], cb);
});

gulp.task('build-config', function() {
    return gulp.src('./build-config.tmpl.js')
        .pipe(plugins.template({config: JSON.stringify({
            buildTimestamp: + new Date()
        })}))
        .pipe(plugins.rename('build-config.js'))
        .pipe(gulp.dest('tmp/'));
});


gulp.task('build-css', function () {
    return buildCss(projectName, './dist/standalone');
});

function buildCss(fileName, dest) {
    var pipe = gulp.src('./src/styles/*')
        .pipe(plugins.plumber({errorHandler: onError}))
        .pipe(plugins.sass())
        .pipe(plugins.concat(fileName + '.css'))
        .pipe(gulp.dest(dest))
        .pipe(plugins.minifyCss())
        .pipe(plugins.rename({extname: '.min.css'}))
        .pipe(gulp.dest(dest));

    return pipe;
}

function buildJs(src, standaloneName,  jsFileName, dest) {

    var pipe = browserify({
        basedir: '.',
        debug: true,
        entries: [src],
        cache: {},
        packageCache: {},
        standalone: standaloneName
    }).transform(stringify, {
        appliesTo: { includeExtensions: ['.html'] }
    })
        .transform("babelify", {presets: ["es2015"],  plugins: ["transform-class-properties", "transform-object-assign", ["babel-plugin-transform-builtin-extend", {globals: ["Error"]}]]})
        .bundle()
        .on('error', map_error)
        .pipe(plugins.plumber({ errorHandler: onError }))
        .pipe(source(jsFileName+'.js'))
        .pipe(gulp.dest(dest))
        .pipe(buffer());
    var development = (argv.dev === undefined) ? false : true;
    if(!development){
        pipe.pipe(sourcemaps.init({loadMaps: true}))
        // .pipe(plugins.stripDebug())
            .pipe(plugins.uglify({
                compress: {
                    // drop_console: true
                }
            }))
            .pipe(plugins.rename({ extname: '.min.js' }))

            .pipe(sourcemaps.write('./'))
            .pipe(gulp.dest(dest));
    }


    return pipe;
}

gulp.task('build-js', ['build-config'], function () {
    var jsFileName =  projectName;
    return buildJs('src/index.js', 'SilverDecisions', jsFileName, "dist/standalone")
});

gulp.task('build-app', ['build-config'], function () {
    var jsFileName =  projectName;
    return buildJs('src/index.js', 'SilverDecisions.App', jsFileName, "dist/standalone")
});

gulp.task('build-expression-engine', ['build-config'], function () {
    var jsFileName =  projectName+"-expression-engine";
    return buildJs('src/expression-engine/index.js', 'SilverDecisions.ExpressionEngine', jsFileName, "dist/expression-engine")
});

gulp.task('build-computations', ['build-config'], function () {
    var jsFileName =  projectName+"-computations";
    return buildJs('src/computations/index.js', 'SilverDecisions.Computations', jsFileName, "dist/computations")
});


gulp.task('build-clean', ['clean'], function () {
    return gulp.start('build');
});

gulp.task('build', ['build-css', 'build-app', 'build-computations', 'build-expression-engine'], function () {
    // var development = (argv.dev === undefined) ? false : true;
    // if(!development){
    //     return generateDocs();
    // }
});

gulp.task('watch', function() {
    gulp.watch(['./src/**/*.html', './src/styles/*.*css', 'src/**/*.js', './src/i18n/*.*json'], ['default']);
});

gulp.task('default', ['build-clean'],  function() {
});

gulp.task('build-templates', function () {
    return gulp.src('src/templates/*.html')
        .pipe(plugins.html2js('templates.js', {
            adapter: 'javascript',
            base: 'templates',
            name: 'templates'
        }))
        .pipe(gulp.dest('dist'));
});

gulp.task('default-watch', ['default'], ()=>{ browserSync.reload();  });
gulp.task('serve', ['default'], ()=>{

    var development = (argv.dev === undefined) ? false : true;
    var baseDir = "demo";
    var index = "index.html";
    if(development){
        index = "dev.html";
    }


    browserSync.init({
        server: {
            baseDir: baseDir,
            index: index,
            routes: {
                "/bower_components": "bower_components",
                "/dist": "dist"
            }
        },
        port: 8089,
        open: 'local',
        browser: "chrome"
    });
    gulp.watch(['i18n/**/*.json', './src/**/*.html', './src/styles/*.*css', 'src/**/*.js', 'examples/**/*.*'], ['default-watch']);
});

// error function for plumber
var onError = function (err) {
    console.log('onError', err);
    this.emit('end');
};


gulp.task('prepare-test', function(){
    return gulp
        .src('test/trees/*.json')
        .pipe(require('gulp-filelist')('tree-json-filelist.json', { flatten: true }))
        .pipe(gulp.dest('test'))
})

gulp.task('test', ['prepare-test'], function (done) {
    new Server({
        configFile: __dirname + '/karma.conf.js',
        singleRun: true
    }, function () {
        done();
    }).start();
});

gulp.task('docs-clean', function (cb) {
    return del(['./docs/silver-decisions-*.min.*'], cb);
});

gulp.task('docs-gen', ['docs-clean'], function () {
    return generateDocs();
});

function generateDocs(){
    gutil.log('generateDocs');
    var basename = "silver-decisions-"+p.version+'.min';
    var copyFiles = gulp.src(['./dist/standalone/silver-decisions.min.js', './dist/standalone/silver-decisions.min.css'])
        .pipe(plugins.rename({
            basename: basename
        }))
        .pipe(gulp.dest('./docs'));

    var computationsBasename = "silver-decisions-computations-"+p.version+'.min'
    var copyComputationsFiles = gulp.src(['./dist/computations/silver-decisions-computations.min.js'])
        .pipe(plugins.rename({
            basename: computationsBasename
        }))
        .pipe(gulp.dest('./docs'));

    var updateReferences = gulp.src('./docs/SilverDecisions.html')
        .pipe(plugins.replace(/"silver-decisions(.*)\.min/g, '"'+basename))
        .pipe(gulp.dest('./docs/'));

    var updateWorkerReferences = gulp.src('./docs/silverdecisions-job-worker.js')
        .pipe(plugins.replace(/silver-decisions-computations-(.*)\.min/g, computationsBasename))
        .pipe(gulp.dest('./docs/'));

    return merge(copyFiles,copyComputationsFiles, updateReferences, updateWorkerReferences)
}

function map_error(err) {
    if (err.fileName) {
        // regular error
        gutil.log(chalk.red(err.name)
            + ': '
            + chalk.yellow(err.fileName.replace(__dirname + '/src/js/', ''))
            + ': '
            + 'Line '
            + chalk.magenta(err.lineNumber)
            + ' & '
            + 'Column '
            + chalk.magenta(err.columnNumber || err.column)
            + ': '
            + chalk.blue(err.description))
    } else {
        // browserify error..
        gutil.log(chalk.red(err.name)
            + ': '
            + chalk.yellow(err.message))
    }

    this.emit('end');
}
