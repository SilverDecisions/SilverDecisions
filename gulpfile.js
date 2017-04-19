var gulp = require('gulp');
var del = require('del');
var merge = require('merge-stream');
var plugins = require('gulp-load-plugins')();
var browserSync = require('browser-sync').create();
var argv = require('yargs').argv;

var browserify = require("browserify");
var resolutions = require('browserify-resolutions');
var source = require('vinyl-source-stream');
var sourcemaps = require('gulp-sourcemaps');
var buffer = require('vinyl-buffer');

var p = require('./package.json'),
stringify = require('stringify');

var Server = require('karma').Server;

/* nicer browserify errors */
var gutil = require('gulp-util');
var chalk = require('chalk');

var projectName= "silver-decisions";

var dependencies = [];

//FIXME automatize detection of nested "/" dependencies
var nestedDependencies = [
    'jquery-ui/ui/scroll-parent',
    'jquery-ui/ui/widget',
    'jquery-ui/ui/widgets/mouse',
    'jquery-ui/ui/widgets/button',
    'jquery-ui/ui/widgets/menu',
    'jquery-ui/ui/widgets/sortable',
    'jquery-ui/ui/unique-id',
    'jquery-ui/ui/position',
    'jquery-ui/ui/keycode',
    'jquery-ui/ui/safe-active-element',
    'jquery-ui/ui/widgets/autocomplete',
    'pivottable/dist/pivot.it',
    'pivottable/dist/pivot.de',
    'pivottable/dist/pivot.fr',
    'pivottable/dist/pivot.pl',

];
dependencies.push(...nestedDependencies);


var vendorDependencies = [];
vendorDependencies.push(...nestedDependencies);

var sdDependencies = [];


for(var k in p.dependencies){
    if(p.dependencies.hasOwnProperty(k)){
        dependencies.push(k);
        if(k.trim().startsWith("sd-")){
            sdDependencies.push(k)
        }else{
            vendorDependencies.push(k)
        }
    }
}

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


gulp.task('build-css', ['build-app-css', 'build-vendor-css'], function () {

});

gulp.task('build-app-css', function () {
    return buildCss(projectName, './src/styles/*', './dist');
});

gulp.task('build-vendor-css', function () {
    return buildCss(projectName+"-vendor", './vendor/css/*', './dist');
});

function buildCss(fileName, src, dest) {
    var pipe = gulp.src(src)
        .pipe(plugins.plumber({errorHandler: onError}))
        .pipe(plugins.sass())
        .pipe(plugins.concat(fileName + '.css'))
        .pipe(gulp.dest(dest))
        .pipe(plugins.minifyCss())
        .pipe(plugins.rename({extname: '.min.css'}))
        .pipe(gulp.dest(dest));

    return pipe;
}

function buildJs(src, standaloneName,  jsFileName, dest, external) {
    if(!external){
        external = []
    }

    var b = browserify({
        basedir: '.',
        debug: true,
        entries: [src],
        cache: {},
        packageCache: {},
        standalone: standaloneName
    }).transform(stringify, {
        appliesTo: { includeExtensions: ['.html'] }
    })
        // .plugin(resolutions, '*')
        .external(external)

    return finishBrowserifyBuild(b,jsFileName, dest)
}

function buildJsDependencies(jsFileName, moduleNames, dest){
    var b = browserify({
        debug: true,
        require: [moduleNames]
    })

    return finishBrowserifyBuild(b, jsFileName, dest)
}

function finishBrowserifyBuild(b, jsFileName, dest){
    var pipe = b
        .transform("babelify", {presets: ["es2015"],  plugins: ["transform-class-properties", "transform-object-assign", "transform-object-rest-spread", "transform-es2015-spread", ["babel-plugin-transform-builtin-extend", {globals: ["Error"]}]]})
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

gulp.task('build-app', ['build-config'], function () {
    var jsFileName =  projectName;
    return buildJs('src/index.js', 'SilverDecisions.App', jsFileName, "dist", dependencies)
});

gulp.task('build-core', function () {
    return buildJsDependencies("silver-decisions-core", sdDependencies, "dist")
});

gulp.task('build-vendor', function () {
    return buildJsDependencies("silver-decisions-vendor", vendorDependencies, "dist")
});

gulp.task('build-clean', ['clean'], function () {
    return gulp.start('build');
});

gulp.task('build', ['build-css', 'build-app', 'build-core', 'build-vendor'], function () {
    // var development = (argv.dev === undefined) ? false : true;
    // if(!development){
    //     return generateDocs();
    // }
});

gulp.task('watch', function() {
    gulp.watch(['./src/**/*.js','./src/**/*.html', './src/i18n/*.*json'], ['build-app']);
    gulp.watch(['./src/styles/*.*css'], ['build-app-css']);
    gulp.watch(['./node_modules/sd-computations/src/**/*.js', './node_modules/sd-model/src/**/*.js', './node_modules/sd-utils/src/**/*.js'], ['build-core']);
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

function copyFilesToDocs(src, basename){
    return gulp.src(src)
        .pipe(plugins.rename({
            basename: basename
        }))
        .pipe(gulp.dest('./docs'));
}

function generateDocs(){
    gutil.log('generateDocs');
    var basename = "silver-decisions-"+p.version+'.min';
    var copyFiles = copyFilesToDocs(['./dist/silver-decisions.min.js', './dist/silver-decisions.min.css'], basename);
    var coreBasename = "silver-decisions-core-"+p.version+'.min';
    var copyCoreFiles = copyFilesToDocs(['./dist/silver-decisions-core.min.js'], coreBasename);
    var copyVendorFiles = copyFilesToDocs(['./dist/silver-decisions-vendor.min.js', './dist/silver-decisions-vendor.min.css'], "silver-decisions-vendor-"+p.version+'.min');

    var updateReferences = gulp.src('./docs/SilverDecisions.html')
        .pipe(plugins.replace(/"silver-decisions(.*)([0-9]+)\.([0-9]+)\.([0-9]+)\.min/g, '"silver-decisions$1'+p.version+'.min'))
        .pipe(gulp.dest('./docs/'));

    var updateWorkerReferences = gulp.src('./docs/silverdecisions-job-worker.js')
        .pipe(plugins.replace(/silver-decisions-core-(.*)\.min/g, coreBasename))
        .pipe(gulp.dest('./docs/'));

    return merge(copyFiles,copyCoreFiles, copyVendorFiles, updateReferences, updateWorkerReferences)
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
        gutil.log(chalk.red(err))
    }

    this.emit('end');
}
