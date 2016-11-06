var gulp  = require('gulp');
var spawn = require('child_process').spawn;
var node;


gulp.task('server', function() {
  if (node) node.kill();
  node = spawn('node', ['testing-file.js'], {stdio: 'inherit'});
  node.on('close', function (code) {
    if (code === 8) {
      gulp.log('Error detected, waiting for changes...');
    }
  });
});

gulp.task('default', function() {
  gulp.run('server');

  gulp.watch(['./testing-file.js', './lib/**/*.js'], function() {
    gulp.run('server');
  });
})

process.on('exit', function() {
    if (node) node.kill()
});
