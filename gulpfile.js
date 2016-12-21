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


gulp.task('build-css', function () {
    var fileName = projectName;
    var pipe = gulp.src('./src/styles/*')
        .pipe(plugins.plumber({errorHandler: onError}))
        .pipe(plugins.sass())
        .pipe(plugins.concat(fileName + '.css'))
        .pipe(gulp.dest('./dist'))
        .pipe(plugins.minifyCss())
        .pipe(plugins.rename({extname: '.min.css'}))
        .pipe(gulp.dest('./dist'));

    return pipe;
});


gulp.task('build-js', function () {
    var jsFileName =  projectName;
    var pipe = browserify({
        basedir: '.',
        debug: true,
        entries: ['src/index.js'],
        cache: {},
        packageCache: {},
        standalone: 'SilverDecisions'
    }).transform(stringify, {
        appliesTo: { includeExtensions: ['.html'] }
    })
        .transform("babelify", {presets: ["es2015"],  plugins: ["transform-class-properties", "transform-object-assign"]})
        .bundle()
        .on('error', map_error)
        .pipe(plugins.plumber({ errorHandler: onError }))
        .pipe(source(jsFileName+'.js'))
        .pipe(gulp.dest("dist"))
        .pipe(buffer());
    var development = (argv.dev === undefined) ? false : true;
    if(!development){
        pipe.pipe(sourcemaps.init({loadMaps: true}))
        // .pipe(plugins.stripDebug())
            .pipe(plugins.uglify({
                compress: {
                    drop_console: true
                }
            }))
            .pipe(plugins.rename({ extname: '.min.js' }))

            .pipe(sourcemaps.write('./'))
            .pipe(gulp.dest("dist"));
    }


    return pipe;
});


gulp.task('build-clean', ['clean'], function () {
    return gulp.start('build');
});

gulp.task('build', ['build-css', 'build-js'], function () {
    // var development = (argv.dev === undefined) ? false : true;
    // if(!development){
    //     return generateDocs();
    // }
});

gulp.task('watch', function() {
    gulp.watch(['./src/**/*.html', './src/styles/*.*css', 'src/**/*.js'], ['default']);
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


gulp.task('test', function (done) {
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
    var copyFiles = gulp.src(['./dist/silver-decisions.min.js', './dist/silver-decisions.min.css'])
        .pipe(plugins.rename({
            basename: basename
        }))
        .pipe(gulp.dest('./docs'));

    var updateReferences = gulp.src('./docs/SilverDecisions.html')
        .pipe(plugins.replace(/"silver-decisions(.*)\.min/g, '"'+basename))
        .pipe(gulp.dest('./docs/'));

    return merge(copyFiles, updateReferences)
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
