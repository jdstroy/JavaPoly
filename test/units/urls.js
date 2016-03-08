"use strict";

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

function utf8ByteArrayToString(bytes) {
  const out = [];
  let pos = 0, c = 0;
  while (pos < bytes.length) {
    const c1 = bytes[pos++];
    if (c1 < 128) {
      out[c++] = String.fromCharCode(c1);
    } else if (c1 > 191 && c1 < 224) {
      const c2 = bytes[pos++];
      out[c++] = String.fromCharCode((c1 & 31) << 6 | c2 & 63);
    } else if (c1 > 239 && c1 < 365) {
      // Surrogate Pair
      const c2 = bytes[pos++];
      const c3 = bytes[pos++];
      const c4 = bytes[pos++];
      const u = ((c1 & 7) << 18 | (c2 & 63) << 12 | (c3 & 63) << 6 | c4 & 63) - 0x10000;
      out[c++] = String.fromCharCode(0xD800 + (u >> 10));
      out[c++] = String.fromCharCode(0xDC00 + (u & 1023));
    } else {
      const c2 = bytes[pos++];
      const c3 = bytes[pos++];
      out[c++] = String.fromCharCode((c1 & 15) << 12 | (c2 & 63) << 6 | c3 & 63);
    }
  }
  return out.join('');
};


function testUrls() {
  if (!isWorkerBased) {
    describe('URLs', function() {
      before(() => {
        return Java.type("com.javapoly.XHRUrlStreamHandlerFactory").then(function(XHRUrlStreamHandlerFactory) {
          return XHRUrlStreamHandlerFactory.register();
        });
      });

      it('should fetch data', function() {
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

      it('should set the request method', function() {
        return Java.type("java.net.URL").then(function(URL) {
          return new URL(window.location.origin + "/api").then(function(url) {
            return url.openConnection().then(function(urlConnection) {
              return urlConnection.setRequestMethod("POST").then(function() {
                return urlConnection.getInputStream().then(function(is) {
                  return readFromIS(is).then(function(content) {
                    const json = JSON.parse(utf8ByteArrayToString(content));
                    expect(json.method).toBe("POST");
                  });
                });
              });
            });
          });
        });
      });

    });
  }
}

