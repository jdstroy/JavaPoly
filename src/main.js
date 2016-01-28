import JavaPoly from './core/JavaPoly';

// Create main object that will be accessed via global objects J and Java
global.window.javapoly = new JavaPoly({
  doppioLibUrl: 'https://www.javapoly.com/doppio/',
  browserfsLibUrl: 'https://www.javapoly.com/browserfs/'
});
