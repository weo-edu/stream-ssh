var ssh2 = require('ssh2');
var corkable = require('corkable');
var Transform = require('readable-stream').Transform;

module.exports = function(config) {
  var conn = new ssh2();
  var stream = new Transform();

  // Disable the default uncork-on-end behavior of streams
  corkable(stream);

  stream._transform = function(cmd, enc, cb) {
    var self = this;
    // Buffer until each command completes
    self.cork();
    conn.exec(cmd, function(err, res) {
      // Pass along errors
      if(err) return cb(err);

      res.on('data', function(data) {
        // Queue output
        self.push(data);
      }).on('end', function() {
        // Accept new commands
        self.uncork();
        cb();
      });
    });
  };

  // Close the connection after all our commands are complete
  stream._flush = function() {
    conn.end();
  };

  conn.connect(config);
  conn.on('ready', function() {
    // Begin executing commands
    stream.uncork();
  });

  // Buffer until the connection is ready
  stream.cork();
  return stream;
}