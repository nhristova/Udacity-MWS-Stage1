// 3.11.6 installing Gulp, instructions from
// https://github.com/gulpjs/gulp/blob/master/docs/getting-started.md
// to run in console (Ctrl+`) type
// gulp default

var gulp = require('gulp');



// 3.13.6 Set up gulp-eslint
// https://www.npmjs.com/package/gulp-eslint
var eslint = require('gulp-eslint');

gulp.task('lint', function() {
    // ESLint ignores files with "node_modules" paths.
    // So, it's best to have gulp ignore the directory as well.
    // Also, Be sure to return the stream from the task;
    // Otherwise, the task may end before the stream has finished.
    return gulp.src(['js/**/*.js','!node_modules/**'])
        // eslint() attaches the lint output to the "eslint" property
        // of the file object so it can be used by other modules.
        .pipe(eslint())
        // eslint.format() outputs the lint results to the console.
        // Alternatively use eslint.formatEach() (see Docs).
        .pipe(eslint.format())
        // To have the process exit with an error code (1) on
        // lint error, return the stream and pipe to failAfterError last.
        .pipe(eslint.failAfterError());
});

// 3.14.3 Development and production modules
gulp.task('copy-html', function() {
    gulp.src(['./**/*.html', '!node_modules/**'])
        .pipe(gulp.dest('./dist'));
    // 3.14.4 Make index.html reload automatically on changes
    // author solution is to create a new watch in default task
    // which watches for changes in the copied dist/index.html
    // and calls browserSync.reload (what is the diff with stream??)
    // .pipe(browserSync.stream());
});

var minifyCss = require('gulp-minify-css');
gulp.task('minify-css', function() {
    gulp.src('./css/*.css')
        .pipe(minifyCss())
        .pipe(gulp.dest('./dist/css'));
});

gulp.task('copy-images', function(){
    gulp.src('./img/*')
        .pipe(gulp.dest('./dist/img'));
});

// 3.14.7 JS concatenation
var concat = require('gulp-concat');
var babel = require('gulp-babel');
// 3.14.8 JS minification
var uglify = require('gulp-uglify');

gulp.task('scripts', function() {
    gulp.src('./js/**/*.js')
        .pipe(babel({
            presets: ['env']
        }))
        .pipe(uglify().on('error', function(e){
            console.log(e);
        }))
        .pipe(gulp.dest('dist/js'));
});

gulp.task('scripts-dist', function() {
    gulp.src('./js/**/*.js')
        .pipe(concat('all.js'))
        .pipe(uglify().on('error', function(e){
            console.log(e);
        }))
        .pipe(gulp.dest('dist/js'));
});

// 3.14.9 Setting up a production task
gulp.task('dist', [
    'copy-html',
    'copy-images',
    'minify-css',
    //'lint',
    'scripts'
]);
