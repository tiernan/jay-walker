var BUILD = 'dist/',
	NS = 'JayWalker',
	SOURCE = 'app/',
	gulp = require('gulp'),
	connect = require('gulp-connect'),
	compression = require('compression'),
	fileNamesToJson = require('./custom_modules/gulp-filenames-to-jsonx'),
	imageMin = require('gulp-imagemin'),
	jsonTransform = require('gulp-json-transform'),
	minifyCSS = require('gulp-clean-css'),
	minifyHTML = require('gulp-minify-html'),
	minifyJS = require('gulp-uglify'),
	minifyJSON = require('gulp-json-minify'),
	prettyData = require('gulp-pretty-data'),
	rename = require('gulp-rename'),
	sass = require('gulp-sass'),
	typeScript = require("gulp-typescript"),
	tsProject = typeScript.createProject("tsconfig.json"),
	useMin = require('gulp-usemin');

// Converts JSON data files to JS scripts under application namespace
gulp.task('convert-json-data', function() {
	return gulp.src(SOURCE + 'data/**/*.json')
		.pipe(rename(function(path) {
			path.extname = '.js';
			return path;
		}))
		.pipe(jsonTransform(function(data, file) {
			return NS + '.data[\'data/' + file.relative + 'on\']=' + JSON.stringify(data);
		}))
		.pipe(gulp.dest(BUILD + 'data/'));
});

// Copy favicon.ico to build
gulp.task('copy-favicon', function() {
	return gulp.src(SOURCE + 'favicon.ico')
		.pipe(gulp.dest(BUILD));
});



// Minify icons
gulp.task('icons', function() {
	return gulp.src(SOURCE + 'icons/*')
		.pipe(imageMin())
		.pipe(gulp.dest(BUILD + 'icons'));
});

// Minify images
gulp.task('images', function() {
	return gulp.src(SOURCE + 'images/*')
		.pipe(imageMin())
		.pipe(gulp.dest(BUILD + 'images'));
});

// Minify JSON data
gulp.task('minify-json', function() {
	return gulp.src(SOURCE + '**/*.json')
		.pipe(minifyJSON())
		.pipe(gulp.dest(BUILD));
});

// Minify service worker
gulp.task('minify-service', function() {
	return gulp.src(SOURCE + 'service-worker.js')
		.pipe(minifyJS())
		.pipe(gulp.dest(BUILD));
});

// Minify XML files
gulp.task('minify-xml', function() {
	return gulp.src(SOURCE + '**/*.xml')
		.pipe(prettyData({type: 'minify', preserveComments: false}))
		.pipe(gulp.dest(BUILD));
});

// Compile Sass
gulp.task('sass', function () {
	return gulp.src(SOURCE + '**/*.scss')
		.pipe(sass().on('error', sass.logError))
		.pipe(gulp.dest(SOURCE));
});

// Compile TypeScript
gulp.task("type-script", function () {
	return tsProject.src(SOURCE + '**/*.ts')
		.pipe(typeScript(tsProject))
		.js.pipe(gulp.dest(SOURCE));
});

// Minify HTML and compile script/css builds
gulp.task('html', ['sass', 'type-script'], function() {
	return gulp.src(SOURCE + '*.html')
		.pipe(useMin({
			css: [minifyCSS],
			html: [function() {
				return minifyHTML({
					empty: true
				});
			}],
			js: [minifyJS],
			jsAttributes: {
				async: true,
			},
			inlinejs: [minifyJS],
			inlinecss: [minifyCSS, 'concat']
		}))
		.pipe(gulp.dest(BUILD));
});

// Catalog build files for service worker cache manifest
gulp.task('files-manifest', ['copy-favicon', 'html', 'icons', 'images', 'minify-json', 'minify-xml'], function() {
	return gulp.src(BUILD + '**/*.*')
		.pipe(fileNamesToJson({
			fileName: 'files-manifest.json',
			base: BUILD,
			ignore: [
				/^files-manifest\.json$/,
				/^data\/.*js$/,
				/^icons\/(?:apple|ms)/,
				/^service-worker.js$/
			]
		}))
		.pipe(gulp.dest(BUILD));
});

// Build
gulp.task('build', ['convert-json-data', 'files-manifest', 'minify-service']);

// Run local web server
gulp.task('web-server', function() {
	connect.server({
		root: BUILD,
		middleware: function() {
			return [
				compression({})
			];
		}
	});
});

// Default task
gulp.task('default', ['web-server']);