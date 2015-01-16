
var gulp            = require('gulp'),
    util            = require('gulp-util'),
    plugins         = require('gulp-load-plugins')(),
    nib             = require('nib'),
    browserify      = require('browserify'),
    source          = require('vinyl-source-stream'),
    buffer          = require('vinyl-buffer'),
    del             = require('del')

// todo: add mocha test runner along with lots of solid tests!

gulp.task('clean:js', function(cb) {
    del(['build/js/**/*.*'], cb)
})

gulp.task('stylus', function() {
    gulp.src('src/assets/styl/main.styl')
        .pipe(plugins.plumber()) // with the plumber the gulp task won't crash on errors
        .pipe(plugins.stylus({
            use:    [nib()],
            errors: true
        }))
        // https://github.com/ai/autoprefixer#browsers
        .pipe(plugins.autoprefixer(
            'last 3 versions',
            '> 1%',
            'Explorer >= 9',
            'Chrome >= 30',
            'Firefox ESR',
            'iOS >= 6', 'android >= 4'
        ))
        .pipe(plugins.minifyCss())
        .pipe(plugins.rename({suffix: '.min', extname: '.css.js'}))
        .pipe(plugins.injectString.wrap('module.exports=\'', '\''))
        .pipe(gulp.dest('src/assets/css'))
        .pipe(plugins.connect.reload())
})

gulp.task('todo', function() {
    gulp.src('src/**/*.{js, styl}', {base: './'})
        .pipe(plugins.todo({
            fileName: 'TODO.md'
        }))
        .pipe(gulp.dest('./'))
})

gulp.task('browserify', ['clean:js'], function(cb) {
    var bundler = browserify({
            entries:    ['./src/index.js'],
            globals:    false,
            debug:      true // enables source maps
        })

    bundler
        .bundle()
        .on('error',    cb)
        .on('log',      util.log)
        .pipe(source('./src/')) // gives streaming vinyl file object
        .pipe(buffer()) // required because the next steps do not support streams
        .pipe(plugins.concat('bundle.js'))
        .pipe(gulp.dest('build/js'))
        .pipe(plugins.connect.reload())
        .on('end', cb)
})

gulp.task('connect', ['build'], function() {
    plugins.connect.server({
        root:       ['test/scenarios/', 'build'],
        port:       8080,
        livereload: true
    })
})

gulp.task('reload', function() {
    plugins.connect.reload()
})

gulp.task('watch', ['connect'], function() {
    gulp.watch(['src/assets/styl/**/*.styl'],   ['stylus'])
    gulp.watch(['src/**/*.js'],                 ['browserify'])
    gulp.watch(['test/scenarios/*.html'],       ['reload'])
})

gulp.task('scenarios', ['connect', 'watch'])
gulp.task('build',   ['stylus', 'browserify'])
gulp.task('default', ['stylus', 'todo'])
