var gulp = require('gulp');
var connect = require('gulp-connect');
var gutil = require('gulp-util');
var seq = require('gulp-sequence');
var less = require('gulp-less');
var sourcemaps = require('gulp-sourcemaps');
var http = require('http');
var browserSync = require('browser-sync').create();

var reload = browserSync.reload;

gulp.task('less', function() {
    gulp.src('./styles/*.less')
        .pipe(sourcemaps.init())
        .pipe(less())
        .pipe(sourcemaps.write('./maps'))
        .pipe(gulp.dest(function(f) {
            return f.base;
        }))
});

gulp.task('less-reload', function () {
    seq('less')(reload);
});

gulp.task('build', function(callback) {
    seq('less')(callback);
});

gulp.task('proxy', function () {
    http.createServer(function(request, response) {
        // Set CORS headers
        response.setHeader('Access-Control-Allow-Origin', '*');
        response.setHeader('Access-Control-Request-Method', '*');
        response.setHeader('Access-Control-Allow-Methods', 'OPTIONS, GET');
        response.setHeader('Access-Control-Allow-Headers', 'authorization, content-type');
        
        if (request.method === 'OPTIONS') {
            response.writeHead(200);
            response.end();
            return;
        }
        
        // Set Testing Routing rule(s)
        if (request.method === 'POST' && request.url === '/save.svc') {
            /*
            var body = [];
            request.on('data', function(chunk) {
                body.push(chunk);
            }).on('end', function() {
                body = Buffer.concat(body).toString();
                
                gutil.log(body);
                response.end(body);
            });
            */
    
            request.pipe(response);
        } 
        else {
            response.statusCode = 404;
            response.end();
        }
  
    }).listen(8080);
});

gulp.task('watch', function () {
    // watch for changes in *.less file(s)
    gulp.watch('./styles/*.less', ['less-reload']);

    // browser sync    
    browserSync.init({
        server: {
            baseDir: '.',
            index: 'etl.html'
        },
        port: 4000,
        ui: {
            port: 4001
        }
    });
});

gulp.task('default', function(callback) {
    seq('build', 'proxy', 'watch')(callback);
})