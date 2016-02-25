function getParams(searchString) {
  function cast(str) {
    try {
      return JSON.parse(str);
    } catch (e) {
      return str;
    }
  }

  var result = {};
  if (searchString.startsWith("?")) {
    var fields = searchString.substring(1).split("&");
    for (var f of fields) {
      var pair = f.split("=");
      if (pair.length == 2) {
        result[pair[0]] = cast(pair[1]);
      }
    }
  }
  return result;
}