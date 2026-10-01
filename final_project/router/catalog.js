'use strict';

const books = require('./booksdb.js');

function entries() {
  if (Array.isArray(books)) {
    return books.map((book, index) => [String(book.isbn ?? index + 1), book]);
  }

  return Object.entries(books);
}

function findBookByISBN(isbn) {
  const requestedISBN = String(isbn).toLowerCase();

  return entries().find(([key, book]) => {
    return (
      String(key).toLowerCase() === requestedISBN ||
      String(book.isbn ?? '').toLowerCase() === requestedISBN
    );
  });
}

function findBooksByField(field, value) {
  const requestedValue = String(value).trim().toLowerCase();

  return entries().filter(([, book]) => {
    return String(book[field] ?? '').trim().toLowerCase() === requestedValue;
  });
}

function asObject(bookEntries) {
  return Object.fromEntries(bookEntries);
}

module.exports = {
  books,
  entries,
  findBookByISBN,
  findBooksByField,
  asObject
};

