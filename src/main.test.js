import JavaPoly from './core/JavaPoly';

/* Parses URL search string. Eg of valid input: "?worker=true&dispatch=fast" */
function getParams(searchString) {
  const result = {};
  if (searchString.startsWith("?")) {
    const fields = searchString.substring(1).split("&");
    for (const f of fields) {
      const pair = f.split("=");
      if (pair.length == 2) {
        result[pair[0]] = pair[1];
      }
    }
  }
  return result;
}

const params = getParams(window.location.search);

const config = params.worker ? {worker:'build/javapoly_worker.js'} : {};

// Create main object that will be accessed via global objects J and Java
global.window.javapoly = new JavaPoly(config);
