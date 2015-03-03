var ssh2 = require('ssh2');
var corkable = require('corkable');
var Transform = require('readable-stream').Transform;
var fs = require('fs');
var path = require('path');

// Config is optional, if they are not passed, you must
// call .connect() on the stream later
module.exports = function(config) {
  var conn = new ssh2();
  var stream = new Transform();

  // Disable the default uncork-on-end behavior of streams
  corkable(stream);

  var buffer = '';
  stream._transform = function(cmd, enc, cb) {
    buffer += cmd.toString();
    var self = this;
    // Make sure we've got text
    cmd = cmd.toString();
    cb();
  };

  // Close the connection after all our commands are complete
  stream._flush = function(cb) {
    var self = this;
    conn.exec(buffer, function(err, res) {
      if(err) throw err;
      res.on('data', function(data) {
        stream.push(data);
      })
      .on('exit', function(code, signal) {
        cb(code);
        conn.end();
      });
    });
  };

  stream.connect = function(config) {
    // If no private key is supplied, default to the current
    // user's key
    if(! config.privateKey) {
      config.privateKey = fs.readFileSync(path.join(process.env.HOME, '.ssh/id_rsa'));
    }

    conn.connect(config);
    conn.on('ready', function() {
      // Begin executing commands
      stream.uncork();
    });

    return stream;
  };

  stream.disconnect = function() {
    conn.end();
  };

  // If config was passed, connect immediately,
  // otherwise buffer until connect() is called
  if(config)
    stream.connect(config);

  // Buffer until the connection is ready
  stream.cork();
  return stream;
};

