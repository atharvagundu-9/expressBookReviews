'use strict';

const express = require('express');
const axios = require('axios');

const { users, doesExist } = require('./auth_users.js');
const {
  books,
  findBookByISBN,
  findBooksByField,
  asObject
} = require('./catalog.js');

const publicUsers = express.Router();

function credentialsFrom(req) {
  return {
    username: req.body?.username ?? req.query.username,
    password: req.body?.password ?? req.query.password
  };
}

// Register a new user.
publicUsers.post('/register', (req, res) => {
  const { username, password } = credentialsFrom(req);

  if (!username || !password) {
    return res.status(400).json({
      message: 'Unable to register user. Username and password are required.'
    });
  }

  if (doesExist(username)) {
    return res.status(409).json({ message: 'User already exists!' });
  }

  users.push({ username, password });
  return res.status(201).json({
    message: 'User successfully registered. You can now log in.'
  });
});

// Task: retrieve every available book.
publicUsers.get('/', (req, res) => {
  return res.status(200).json(books);
});

// Task: retrieve a book by ISBN.
publicUsers.get('/isbn/:isbn', (req, res) => {
  const match = findBookByISBN(req.params.isbn);

  if (!match) {
    return res.status(404).json({ message: 'Book not found' });
  }

  return res.status(200).json(match[1]);
});

// Task: retrieve all books by the specified author.
publicUsers.get('/author/:author', (req, res) => {
  const matches = findBooksByField('author', req.params.author);

  if (matches.length === 0) {
    return res.status(404).json({ message: 'No books found for this author' });
  }

  return res.status(200).json(asObject(matches));
});

// Task: retrieve all books with the specified title.
publicUsers.get('/title/:title', (req, res) => {
  const matches = findBooksByField('title', req.params.title);

  if (matches.length === 0) {
    return res.status(404).json({ message: 'No books found with this title' });
  }

  return res.status(200).json(asObject(matches));
});

// Task: retrieve the reviews for a book.
publicUsers.get('/review/:isbn', (req, res) => {
  const match = findBookByISBN(req.params.isbn);

  if (!match) {
    return res.status(404).json({ message: 'Book not found' });
  }

  return res.status(200).json(match[1].reviews ?? {});
});

/*
 * Promise/async implementations used by the final asynchronous-programming
 * tasks. A custom base URL allows automated tests to use any available port.
 */
function createBookClient(baseURL = process.env.BOOK_API_URL || 'http://localhost:5000') {
  const client = axios.create({ baseURL, timeout: 5000 });

  const getAllBooks = async () => {
    const response = await client.get('/');
    return response.data;
  };

  const getBookByISBN = (isbn) => {
    return client.get(`/isbn/${encodeURIComponent(isbn)}`).then(response => response.data);
  };

  const getBooksByAuthor = async (author) => {
    const response = await client.get(`/author/${encodeURIComponent(author)}`);
    return response.data;
  };

  const getBooksByTitle = async (title) => {
    const response = await client.get(`/title/${encodeURIComponent(title)}`);
    return response.data;
  };

  return { getAllBooks, getBookByISBN, getBooksByAuthor, getBooksByTitle };
}

module.exports.general = publicUsers;
module.exports.createBookClient = createBookClient;

