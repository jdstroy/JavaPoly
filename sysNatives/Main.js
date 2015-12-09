function wrapObject(thread, obj) {
   var arry = util.newArrayFromData(
     thread,
     thread.getBsCl(),
     '[Ljava/lang/Object;',
     [obj]
   );
   return arry;
}

registerNatives({
  'javapoly/Main': {

    'println(Ljava/lang/String;)V': function(thread, msg) {
       console.log("JVM>", msg.toString());
     },

    'dispatchMessage(Ljava/lang/Object;)V': function(thread, msgId) {
       var callback = window.javaPolyIds[msgId];
       delete window.javaPolyIds[msgId];
       thread.setStatus(6); // ASYNC_WAITING
       callback(thread, function() {
         thread.asyncReturn();
       });
     },

    'installListener()V': function(thread) {
      window.javaPolyEvents = [];
      window.addEventListener("message", function(event) {
        if (event.origin == window.location.origin) {
          if (typeof (event.data.javapoly) == "object") {
            event.preventDefault();
            window.javaPolyEvents.push(event);

            if (window.javaPolyCallback) {
              window.javaPolyCallback();
            }
          }
        }
      });
      if (window.javaPolyInitialisedCallback) {
        var callback = window.javaPolyInitialisedCallback;
        delete window.javaPolyInitialisedCallback;
        callback();
      }
    },

    'getMessage()[Ljava/lang/Object;': function(thread) {
       if (window.javaPolyEvents.length > 0) {
         var event = window.javaPolyEvents.pop();
         return wrapObject(thread, event.data.javapoly.messageId);
       } else {
         thread.setStatus(6); // ASYNC_WAITING
         window.javaPolyCallback = function() {
           delete window.javaPolyCallback;
           var event = window.javaPolyEvents.pop();
           thread.asyncReturn( wrapObject(thread, event.data.javapoly.messageId) );
         }
       }
    }
  }
});
