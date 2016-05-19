"use strict";

function testCrypto() {

  describe('Test javax crypto ', function() {
    it('Mac', function() {
      return JavaPoly.type('javax.crypto.Mac').then(function(Mac) {
        return Mac.getInstance("HmacMD5").then(function(hmacInstance) {
          expect(hmacInstance).toExist();
        });
      });
    });
    it('sha256', function() {
      return JavaPoly.type('ShaTest').then(function(ShaTest) {
        return ShaTest.sha256("noise").then(function(result) {
          expect(result).toEqual(-17);
        });
      });
    });
  });

}

