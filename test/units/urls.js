function readFromIS(is, callback) {
  const bytes = [];
  return new Promise(function(resolve, reject) {
  function handleRead(byte) {
        if (byte < 0) {
          resolve(bytes);
        } else {
          bytes.push(byte);
          is.read().then(handleRead);
        }
      }
    is.read().then(handleRead);
  });
}

function testUrls() {
  if (!isWorkerBased) {
    describe('URLs', function() {
      it('should fetch data', function() {
        return Java.type("com.javapoly.XHRUrlStreamHandlerFactory").then(function(XHRUrlStreamHandlerFactory) {
          return XHRUrlStreamHandlerFactory.register().then(function() {
            return Java.type("java.net.URL").then(function(URL) {
              return new URL(window.location.origin + "/simpleResponse.bin").then(function(url) {
                return url.openConnection().then(function(urlConnection) {
                  var headerPromise = urlConnection.getHeaderField('content-type').then(function(contentType) {
                    expect(contentType).toBe('application/octet-stream');
                  });
                  var contentPromise = urlConnection.getInputStream().then(function(is) {
                    return readFromIS(is).then(function(content) {
                      expect(content[0]).toBe(97);
                      expect(content[1]).toBe(98);
                      expect(content[2]).toBe(99);
                    });
                  });
                  return Promise.all([headerPromise, contentPromise]);
                });
              });
            });
          });
        });
      });
    });
  }
}

