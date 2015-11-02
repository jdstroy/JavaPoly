var gulp = require("gulp");
var babel = require("gulp-babel");
var rename = require("gulp-rename");

gulp.task("default", function () {
  return gulp.src("src/main.js")
    .pipe(babel())
    .pipe(rename('javapoly.js'))
    .pipe(gulp.dest("."));
});
