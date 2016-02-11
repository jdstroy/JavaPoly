var javapoly0;

function wrapObject(thread, obj) {
  var objectType = typeof obj;
  if (Array.isArray(obj)) {
    return wrapArray(thread, obj);
  } else if (objectType === 'string') {
    return wrapString(thread, obj);
  } else if (objectType === 'number') {
    return wrapNumber(thread, obj);
  } else if (objectType === 'boolean') {
    // We need to cast to number because Doppio JVM represents booleans as numbers
    const intValue = obj ? 1 : 0;
    return util.boxPrimitiveValue(thread, 'Z', intValue);
  } else {
    var possibleJavaObj = javapoly0.unwrapJavaObject(obj);
    return possibleJavaObj == null ? obj : possibleJavaObj;
  }
}

function wrapString(thread, obj) {
  return javapoly0.jvm.internString(obj);
}

function wrapArray(thread, obj) {
  var wrappedArr = [];
  for (var i = 0; i < obj.length; i++) {
    wrappedArr.push(wrapObject(thread, obj[i]));
  }
  return util.newArrayFromData(thread, thread.getBsCl(), '[Ljava/lang/Object;', wrappedArr);
}

function wrapNumber(thread, obj) {
  return util.boxPrimitiveValue(thread, 'D', obj)
}

function getPublicFields(obj) {
  // Mimicking a set, based on http://stackoverflow.com/a/18890005
  var nonFinalNamesSet = Object.create(null);
  var finalNamesSet = Object.create(null);

  var fields = obj.constructor.cls.fields;
  // console.log("cls", obj.constructor.cls, " fields", fields);
  for (var i in fields) {
    var field = fields[i];
    if (field.accessFlags.isPublic()) {
      if (field.accessFlags.isFinal()) {
        finalNamesSet[field.name] = true;
      } else {
        nonFinalNamesSet[field.name] = true;
      }
    }
  }
  return {nonFinal: Object.keys(nonFinalNamesSet), "final": Object.keys(finalNamesSet)};
}

function getPublicInstanceMethodsFromClass(cls, set) {
  var methods = cls.getMethods();
  for (var i in methods) {
    var method = methods[i];
    set[method.name] = true;
  }
  if (cls.superClass) {
    getPublicInstanceMethodsFromClass(cls.superClass, set);
  }
}

function getPublicInstanceMethods(obj) {
  // Mimicking a set, based on http://stackoverflow.com/a/18890005
  var methodNamesSet = Object.create(null);
  getPublicInstanceMethodsFromClass(obj.constructor.cls, methodNamesSet);
  return Object.keys(methodNamesSet);
}

function isValidNumber(gLong) {
  var max = 2097151;
  var absgLong = gLong.isNegative() ? gLong.negate() : gLong;
  return absgLong.getHighBits() < max || (absgLong.getHighBits() === max && absgLong.getLowBits() < 0 );
}

/* Converts a Java object to a JS friendly object. Primitive numbers, primitive booleans, strings and arrays are
 * converted to their JS counter-parts. Others are wrapped with JavaObjectWrapper */
function javaObjToJS(thread, obj) {
  if (obj === null)
    return null;
  if (obj['getClass']) {
    var cls = obj.getClass();
    if (cls.className === 'Ljava/lang/String;') {
      return obj.toString();
    } else if (cls.className === 'Ljava/lang/Boolean;') {
      return obj['java/lang/Boolean/value'] == 1;
    } else if (cls.className === 'Ljava/lang/Long;') {
      var gLong = obj.unbox();
      if (isValidNumber(gLong)) {
        return gLong.toNumber();
      } else {
        throw new RangeError("Unfortunately, JavaScript does not yet support 64 bit integers.");
      }
    } else if (cls.className.charAt(0) === '[') {
      var nativeArray = [];
      for (var i = 0; i < obj.array.length; i++) {
        nativeArray.push(javaObjToJS(thread, obj.array[i]));
      }
      return nativeArray;
    } else {
      if (obj.unbox) {
        return obj.unbox();
      } else {
        var fields = getPublicFields(obj);
        return javapoly0.wrapJavaObject(obj, getPublicInstanceMethods(obj), fields.nonFinal, fields.final);
      }
    }
  }
}

function flatThrowableToJS(ft) {
  var cause = ft["com/javapoly/FlatThrowable/causedBy"];
  return {
    name: ft["com/javapoly/FlatThrowable/name"].toString(),
    message: ft["com/javapoly/FlatThrowable/message"].toString(),
    stack: ft["com/javapoly/FlatThrowable/stack"].array.map(e => e.toString()),
    causedBy: cause === null ? null : flatThrwoableToJs(cause)
  }
}

registerNatives({
  'com/javapoly/DoppioBridge': {

    'dispatchMessage(Ljava/lang/String;)V': function(thread, obj, msgId) {
      var callback = javapoly0.dispatcher.getMessageCallback(msgId);
      thread.setStatus(6); // ASYNC_WAITING
      callback(thread, function() {
        thread.asyncReturn();
      });
    },

    'returnResult(Ljava/lang/String;Ljava/lang/Object;)V': function(thread, obj, msgId, returnValue) {
      javapoly0.dispatcher.callbackMessage(msgId,{success:true, returnValue: javaObjToJS(thread, returnValue)});
     },

    'returnErrorFlat(Ljava/lang/String;Lcom/javapoly/FlatThrowable;)V': function(thread, obj, msgId, flatThrowable) {
      javapoly0.dispatcher.callbackMessage(msgId, {success:false, cause: flatThrowableToJS(flatThrowable)});
     },

    'getMessageId()Ljava/lang/String;': function(thread, obj) {
      var id = javapoly0.dispatcher.getMessageId();
      if (id) {
        return wrapObject(thread, id);
      } else {
        thread.setStatus(6); // ASYNC_WAITING
        javapoly0.dispatcher.setJavaPolyCallback(function() {
          javapoly0.dispatcher.setJavaPolyCallback(null);
          thread.asyncReturn( wrapObject(thread, javapoly0.dispatcher.getMessageId()));
        });
      }
    },

    'getMessageType(Ljava/lang/String;)Ljava/lang/String;': function(thread, obj, msgId) {
      var unwrappedData = javapoly0.dispatcher.getMessageType(msgId);
      if (typeof unwrappedData !== 'undefined') {
        return wrapObject(thread, unwrappedData);
      } else {
        return null;
      }
    },

    'getData(Ljava/lang/String;)[Ljava/lang/Object;': function(thread, obj, msgId) {
      var unwrappedData = javapoly0.dispatcher.getMessageData(msgId);
      if (typeof unwrappedData !== 'undefined') {
        return wrapObject(thread, unwrappedData);
      } else {
        return null;
      }
    },

    'setJavaPolyInstanceId(Ljava/lang/String;)V': function(thread, obj, javapolyId){
      javapoly0 = JavaPoly.getInstance(javapolyId);
    }
  }
});
