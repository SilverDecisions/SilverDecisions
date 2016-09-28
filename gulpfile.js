var gulp = require('gulp');
var del = require('del');
var merge = require('merge-stream');
var plugins = require('gulp-load-plugins')();
var browserSync = require('browser-sync').create();

var browserify = require("browserify");
var source = require('vinyl-source-stream');
var tsify = require("tsify");
var sourcemaps = require('gulp-sourcemaps');
var buffer = require('vinyl-buffer');

var projectName= "silver-decisions"

gulp.task('clean', function (cb) {
    return del(['tmp', 'dist'], cb);
});

gulp.task('build-css', function () {
    var fileName = projectName;
    return gulp.src('./src/styles/*')
        .pipe(plugins.plumber({ errorHandler: onError }))
        .pipe(plugins.sass())
        .pipe(plugins.concat(fileName+'.css'))
        .pipe(gulp.dest('./dist'))
        .pipe(plugins.minifyCss())
        .pipe(plugins.rename({ extname: '.min.css' }))
        .pipe(gulp.dest('./dist'));
});


gulp.task('build-js', function () {
    var jsFileName =  projectName;
    return browserify({
        basedir: '.',
        debug: true,
        entries: ['src/index.js'],
        cache: {},
        packageCache: {},
        standalone: 'SilverDecisions'
    })
        .transform("babelify", {presets: ["es2015"],  plugins: ["transform-class-properties"]})
        .bundle()
        .pipe(plugins.plumber({ errorHandler: onError }))
        .pipe(source(jsFileName+'.js'))
        .pipe(gulp.dest("dist"))
        .pipe(buffer())

        .pipe(sourcemaps.init({loadMaps: true}))
        .pipe(plugins.stripDebug())
        .pipe(plugins.uglify())
        .pipe(plugins.rename({ extname: '.min.js' }))

        .pipe(sourcemaps.write('./'))
        .pipe(gulp.dest("dist"));
});


gulp.task('build-clean', ['clean'], function () {
    gulp.start('build');
});

gulp.task('build', ['build-css', 'build-js'], function () {
    
});

gulp.task('watch', function() {
    return gulp.watch(['./src/**/*.html', './src/styles/*.*css', 'src/**/*.js'], ['default']);
});

gulp.task('default', ['build-clean'],  function() {

});

gulp.task('build-templates', function () {
    gulp.src('src/templates/*.html')
        .pipe(plugins.html2js('templates.js', {
            adapter: 'javascript',
            base: 'templates',
            name: 'templates'
        }))
        .pipe(gulp.dest('dist'));
});

gulp.task('default-watch', ['default'], ()=>{ browserSync.reload() });
gulp.task('serve', ['default'], ()=>{
    browserSync.init({
        server: {
            baseDir: "demo",
            index: "index.html",
            routes: {
                "/bower_components": "bower_components",
                "/dist": "dist"
            }
        },
        port: 8089,
        open: 'local',
        browser: "google chrome"
    });
    gulp.watch(['i18n/**/*.json', './src/**/*.html', './src/styles/*.*css', 'src/**/*.js', 'examples/**/*.*'], ['default-watch']);
});

// error function for plumber
var onError = function (err) {
    console.log(err);
    this.emit('end');
};