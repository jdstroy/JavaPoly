function hold(References, n) {
  if (n < 10) {
    return References.hold({n:n}).then(function (){
      return hold(References, n + 1);
    });
  } else {
    return Promise.resolve(n + 1);
  }
}

function testReference() {
  describe('hold and release weak references', function(){
    it('should release references', function(){
      return JavaPoly.type('References').then(function(References) {
        return hold(References, 0).then(function() {
          return JavaPoly.type('java.lang.Thread').then(function(Thread) {
            return Thread.sleep(1000).then(function (){
              return References.release().then(function (){
                return new Promise((resolve) => {
                  setTimeout(resolve, 2000);
                });
              });
            });
          });
        });
      });
    });
  });
}
