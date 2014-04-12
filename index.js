var ssh2 = require('ssh2');
var consoleStream = require('console-stream');
var fs = require('fs');
var through = require('through');
var es = require('event-stream');
var conn = new ssh2();
module.exports = function(config) {

  var ready = false;
  return es.through(function(data) {
    var self = this;
    if(! ready) {
      console.log('not ready');
      this.pause();
      conn.connect(config);
      conn.on('ready', function() {
        self.resume();
        self.emit('data', data);
        ready = true;
        console.log('ready');
      });
    } else
      self.emit('data', data);
  })
};

function exec() {

}

fs.createReadStream('./test.sh')
  .pipe(es.split())
  .pipe(module.exports({
  host: '107.170.198.91',
  username: 'task',
  privateKey: fs.readFileSync('/Users/andrewshaffer/.ssh/id_rsa')
}))
  .pipe(es.through(function(data) {
    this.pause();
    console.log('commmand', data);
    var self = this;
    conn.exec(data, function(err, stream) {
      stream.on('data', function(data) {
        self.emit('data', data);
      })
      .on('end', function() {
        console.log('resume');
        self.resume();
      });
    })
  }))
  .pipe(consoleStream());