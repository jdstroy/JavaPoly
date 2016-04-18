function testJarFile() {
  describe('Test JAR file', function() {
    it('com.javapoly.utils.Math.add', function() {
      return JavaPoly.type('com.javapoly.utils.Math').then(function(Math) {
        Math.add(10, 20).then(function(result) {
          expect(result).toEqual(30);
        });
      });
    });
  });
}
