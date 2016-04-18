registerNatives({
  'com/javapoly/XHRHttpURLConnection': {

    'getResponse([Ljava/lang/String;Ljava/lang/String;Ljava/lang/String;[B)Lcom/javapoly/XHRResponse;': function(thread, headers, method, url, outputBytes) {
      const methodStr = method.toString();
      const urlStr = url.toString();
      const myRequest = new XMLHttpRequest();
      myRequest.open(methodStr, urlStr);

      // Set the headers
      {
        const headerArray = headers.array;
        const headerCount = headerArray.length / 2;
        for (let i = 0; i < headerCount; i++) {
          myRequest.setRequestHeader(headerArray[2*i], headerArray[2*i + 1]);
        }
      }

      myRequest.responseType = "arraybuffer";
      myRequest.addEventListener("load", () => {
        thread.getBsCl().initializeClass(thread, 'Lcom/javapoly/XHRResponse;', () => {
          const responseObj = util.newObject(thread, thread.getBsCl(), 'Lcom/javapoly/XHRResponse;');
          responseObj['<init>(Ljava/lang/Object;)V'](thread, [myRequest], (e) => {
            if (e) {
              thread.throwException(e);
            } else {
              thread.asyncReturn(responseObj);
            }
          });
        });
      });

      thread.setStatus(6); // ASYNC_WAITING

      if (outputBytes == null) {
        myRequest.send();
      } else {
        myRequest.send(outputBytes.array);
      }

    }
  },

  'com/javapoly/XHRResponse': {

    'getResponseBytes(Ljava/lang/Object;)[B': function(thread, xhrObj) {
      const array = Array.from(new Uint8Array(xhrObj.response));
      return util.newArrayFromData(thread, thread.getBsCl(), "[B", array);
    },

    'getHeaderField(Ljava/lang/Object;Ljava/lang/String;)Ljava/lang/String;': function(thread, xhrObj, name) {
      return util.initString(thread.getBsCl(), xhrObj.getResponseHeader(name));
    }
  }
});
