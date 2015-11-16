var assert = require('assert');
var classfile = require('./../src/tools/classfile.js');
var fs = require('fs');
var path = require('path');

describe('classfile', function() {
  describe('#analyze', function () {    
    it('classes/Main.class', function () {
      fs.readFile(path.join(__dirname, './classes/Main.class'), (err, data)=> {
        var info = classfile.analyze(data);
        assert.equal(info.this_class, 'Main');
        assert.equal(info.super_class, 'java/lang/Object');
      })
    });
  });
});


