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
var runSequence = require('run-sequence');

/* nicer browserify errors */
var gutil = require('gulp-util');
var chalk = require('chalk');

var projectName= "silver-decisions";
let treeDesignerModule = "sd-tree-designer";

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
    'odc-d3/src/scatterplot',
    'odc-d3/src/diverging-stacked-bar-chart',
    'odc-d3/src/line-chart',


];

var nestedSdDependencies = [
    'sd-computations/src/validation/mcdm-weight-value-validator',
    'sd-computations/src/policies/policy',
    'sd-computations/src/jobs/engine/job-parameter-definition'
];

dependencies.push(...nestedDependencies);
dependencies.push(...nestedSdDependencies);

var vendorDependencies = [];
vendorDependencies.push(...nestedDependencies);

var sdDependencies = [];
var sdCoreDependencies = [];

let checkedModules = [];
let coreVendor = [];
[p, require('./node_modules/sd-tree-designer/package.json')].forEach(p=>{
    Object.getOwnPropertyNames(p.dependencies).forEach(n=>checkModule(n))
});

function checkModule(name, inCore=false){

    name = name.trim();
    dependencies.push(name);

    if(checkedModules.indexOf(name)>-1){
        return;
    }
    checkedModules.push(name);

    if(name.startsWith("sd-")){
        sdDependencies.push(name);
        if(name !== treeDesignerModule && sdCoreDependencies.indexOf(name)<0){
            sdCoreDependencies.push(name);
            Object.getOwnPropertyNames(require('./node_modules/'+name+'/package.json').dependencies).forEach(n=>checkModule(n, true))
        }

    }else {
        let index = vendorDependencies.indexOf(name);
        if(inCore){
             //remove vendor dependencies bundled with core
            if(index > -1){
                vendorDependencies.splice(index, 1);
            }
            coreVendor.push(name)
        }else{
            if(index<0){
                vendorDependencies.push(name)
            }
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
    return buildCss(projectName, ['node_modules/sd-tree-designer/src/styles/*', './src/styles/*'], './dist');
});

gulp.task('build-vendor-css', function () {
    return buildCss(projectName+"-vendor", './vendor/css/*', './dist');
});

function buildCss(fileName, src, dest, failOnError) {
    var pipe = gulp.src(src);

    if(!failOnError){
        pipe = pipe.pipe(plugins.plumber({ errorHandler: onError }))
    }

    return pipe.pipe(plugins.plumber({errorHandler: (err)=>onError(err,failOnError)}))
        .pipe(plugins.sass())
        .pipe(plugins.concat(fileName + '.css'))
        .pipe(gulp.dest(dest))
        .pipe(plugins.minifyCss())
        .pipe(plugins.rename({extname: '.min.css'}))
        .pipe(gulp.dest(dest));
}

function buildJs(src, standaloneName,  jsFileName, dest, external, failOnError) {
    if(!external){
        external = []
    }

    var b = browserify({
        basedir: '.',
        debug: true,
        entries: [src],
        cache: {},
        packageCache: {},
        standalone: standaloneName,
        noBundleExternal: true
    }).transform(stringify, {
        appliesTo: { includeExtensions: ['.html'] }
    })
        // .plugin(resolutions, '*')
        .external(external)

    return finishBrowserifyBuild(b,jsFileName, dest, failOnError)
}

function buildJsDependencies(jsFileName, moduleNames, dest, failOnError, external){
    var b = browserify({
        debug: true,
        require: [moduleNames],

    })

    if(external){
        b = b.external(external);
    }


    return finishBrowserifyBuild(b, jsFileName, dest, failOnError)
}

function finishBrowserifyBuild(b, jsFileName, dest, failOnError){
    var pipe = b
        .transform("babelify", {presets: ["es2015"],  plugins: ["transform-class-properties", "transform-object-assign", "transform-object-rest-spread", "transform-es2015-spread", ["babel-plugin-transform-builtin-extend", {globals: ["Error"]}]]})
        .bundle();

    if(!failOnError){
        pipe = pipe.on('error', map_error )
            .pipe(plugins.plumber({ errorHandler: onError }))
    }

    pipe = pipe.pipe(source(jsFileName+'.js'))
        .pipe(gulp.dest(dest))
        .pipe(buffer());
    var development = (argv.dev === undefined) ? false : true;
    if(!development){
        pipe = pipe.pipe(sourcemaps.init({loadMaps: true}))
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
    return buildApp(true)
});

gulp.task('build-app-watch', ['build-config'], function () {
    return buildApp(false)
});

function buildApp(failOnError){
    var jsFileName =  projectName;

    return buildJs('src/index.js', 'SilverDecisions.App', jsFileName, "dist", dependencies.filter(n=> n !== treeDesignerModule), failOnError)
}

gulp.task('build-core', function () {
    return buildJsDependencies("silver-decisions-core", sdCoreDependencies.concat(nestedSdDependencies), "dist", true)
});


gulp.task('build-vendor', function () {
    return buildJsDependencies("silver-decisions-vendor", vendorDependencies, "dist", true, coreVendor.concat(nestedSdDependencies))
});

gulp.task('build-clean', function (cb) {
    return runSequence('clean', 'build', cb);
});

gulp.task('build', ['build-css', 'build-app', 'build-core', 'build-vendor'], function () {

});

gulp.task('watch', function() {
    watch();
});

function watch(callback){
    gulp.watch(['./src/**/*.js','./src/**/*.html', './src/i18n/*.*json']).on('change', () => {
        runSequence('build-app-watch', callback)
    });
    gulp.watch(['./src/styles/*.*css']).on('change', () => {
        runSequence('build-app-css', callback)
    });
    gulp.watch(['./node_modules/sd-computations/src/**/*.js', './node_modules/sd-model/src/**/*.js', './node_modules/sd-utils/src/**/*.js']).on('change', () => {
        runSequence('build-core', callback)
    });
}

gulp.task('default',  function(cb) {
    return runSequence('build-clean', 'docs-gen', 'test', cb);
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

gulp.task('default-watch', ['build-clean'], ()=>{ browserSync.reload();  });
gulp.task('serve', ['build-clean'], (cb)=>{

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
                "/dist": "dist",
                "/docs": "docs"
            }
        },
        port: 8089,
        open: 'local',
        browser: "chrome"
    });

    watch(()=>{ browserSync.reload();  })
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
    return runTest(true, done)
});

gulp.task('test-watch', ['prepare-test'], function (done) {
    return runTest(false, done)
});

function runTest(singleRun, done){
    return new Server({
        configFile: __dirname + '/karma.conf.js',
        singleRun: singleRun
    }, function (err) {
        done(err);
    }).start();
}

gulp.task('docs-clean', function (cb) {
    return del(['./docs/app/gen/**/*'], cb);
});

gulp.task('docs-gen', ['docs-copy-files'], function () {
    var updateReferences = gulp.src('./docs/SilverDecisions.html')
        .pipe(plugins.replace(/"\.\/app\/gen\/silver-decisions(.*)([0-9]+)\.([0-9]+)\.([0-9]+)\.min/g, '"./app/gen/silver-decisions$1'+p.version+'.min'))
        .pipe(plugins.replace(/"\.\/app\/gen\/silverdecisions(.*)([0-9]+)\.([0-9]+)\.([0-9]+)/g, '"./app/gen/silverdecisions$1'+p.version))
        .pipe(gulp.dest('./docs/'));

    var coreBasename = "silver-decisions-core-"+p.version+'.min';
    var updateWorkerReferences = gulp.src('./docs/app/gen/silverdecisions-job-worker-'+p.version+'.js')
        .pipe(plugins.replace(/silver-decisions-core\.min/g, coreBasename))
        .pipe(gulp.dest('./docs/app/gen/'));

    var updateWorkerReferences2 = gulp.src('./docs/app/gen/silverdecisions-'+p.version+'.js')
        .pipe(plugins.replace(/\.\/silverdecisions-job-worker.js/g, "./app/gen/silverdecisions-job-worker-"+p.version+'.js'))
        .pipe(gulp.dest('./docs/app/gen/'));

    return merge(updateReferences, updateWorkerReferences, updateWorkerReferences2)
});

gulp.task('docs-copy-files', ['docs-clean'], function () {
    var basename = "silver-decisions-"+p.version+'.min';
    var copyFiles = copyFilesToDocs(['./dist/silver-decisions.min.js', './dist/silver-decisions.min.css'], basename);
    var coreBasename = "silver-decisions-core-"+p.version+'.min';
    var copyCoreFiles = copyFilesToDocs(['./dist/silver-decisions-core.min.js'], coreBasename);
    var copyVendorFiles = copyFilesToDocs(['./dist/silver-decisions-vendor.min.js', './dist/silver-decisions-vendor.min.css'], "silver-decisions-vendor-"+p.version+'.min');
    var copyAppFiles = copyFilesToDocs(['./docs/app/src/silverdecisions.js', './docs/app/src/silverdecisions.css'], "silverdecisions-"+p.version+'');
    var copyWorkerFiles = copyFilesToDocs(['./docs/app/src/silverdecisions-job-worker.js'], "silverdecisions-job-worker-"+p.version+'');

    return merge(copyFiles,copyCoreFiles, copyVendorFiles, copyAppFiles, copyWorkerFiles)
});

function copyFilesToDocs(src, basename){
    return gulp.src(src)
        .pipe(plugins.rename({
            basename: basename
        }))
        .pipe(gulp.dest('./docs/app/gen/'));
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
