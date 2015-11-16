var assert = require('assert');
var fs = require('fs');
var path = require('path');
var fsext = require('./../src/tools/fsext.js')(fs, path);

describe('fsext', function() {
  describe('#rmkdirSync', function () {    
    it('create relative path dir', function () {
      try {
        fsext.rmkdirSync('hello/world/folder');
      } finally {
        fs.rmdirSync('hello/world/folder');
        fs.rmdirSync('hello/world');
        fs.rmdirSync('hello');
      }
    });
  });
});


