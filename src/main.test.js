"use strict";
import JavaPoly from './core/JavaPoly';

/* Parses URL search string. Eg of valid input: "?worker=true&dispatch=fast" */
function getParams(searchString) {
  function cast(str) {
    try {
      return JSON.parse(str);
    } catch (e) {
      return str;
    }
  }

  const result = {};
  if (searchString.startsWith("?")) {
    const fields = searchString.substring(1).split("&");
    for (const f of fields) {
      const pair = f.split("=");
      if (pair.length == 2) {
        result[pair[0]] = cast(pair[1]);
      }
    }
  }
  return result;
}

const params = getParams(window.location.search);

const config = {assertionsEnabled: true};

Object.assign(config, params);

// Create a default JavaPoly Instance in global.window.defaultJavaPoly.
// The main object that will be accessed via global objects J and Java
global.window.defaultJavapoly = new JavaPoly(config);
