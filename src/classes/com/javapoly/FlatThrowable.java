package com.javapoly;

/** A flattened version of Throwable for easy serialisation to JS */
class FlatThrowable {
  final String name;
  final String message;
  final String[] stack;
  final FlatThrowable causedBy;

  FlatThrowable(final String name, final String message, final String[] stack, final FlatThrowable causedBy) {
    this.name = name;
    this.message = message;
    this.stack = stack;
    this.causedBy = causedBy;
  }
}
