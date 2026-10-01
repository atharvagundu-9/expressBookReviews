'use strict';

const express = require('express');
const jwt = require('jsonwebtoken');

const { findBookByISBN } = require('./catalog.js');

const registeredUsers = express.Router();
const users = [];
const JWT_SECRET = process.env.JWT_SECRET || 'book-review-access-secret';

const isValid = username => {
  return users.some(user => user.username === username);
};

const doesExist = isValid;

const authenticatedUser = (username, password) => {
  return users.some(user => {
    return user.username === username && user.password === password;
  });
};

function credentialsFrom(req) {
  return {
    username: req.body?.username ?? req.query.username,
    password: req.body?.password ?? req.query.password
  };
}

registeredUsers.post('/login', (req, res) => {
  const { username, password } = credentialsFrom(req);

  if (!username || !password) {
    return res.status(400).json({ message: 'Username and password are required' });
  }

  if (!authenticatedUser(username, password)) {
    return res.status(401).json({
      message: 'Invalid login. Check the username and password.'
    });
  }

  const accessToken = jwt.sign({ username }, JWT_SECRET, { expiresIn: '1h' });
  req.session.authorization = { accessToken };

  return res.status(200).json({ message: 'User successfully logged in' });
});

// Add a review, or update the logged-in user's existing review.
registeredUsers.put('/auth/review/:isbn', (req, res) => {
  const match = findBookByISBN(req.params.isbn);

  if (!match) {
    return res.status(404).json({ message: 'Book not found' });
  }

  const review = req.body?.review ?? req.query.review;
  if (typeof review !== 'string' || review.trim().length === 0) {
    return res.status(400).json({ message: 'Review text is required' });
  }

  const book = match[1];
  const username = req.user.username;
  const wasUpdated = Object.prototype.hasOwnProperty.call(book.reviews, username);

  // A username-keyed object makes each user's write independent, preventing
  // one user's update from overwriting another user's review.
  book.reviews[username] = review.trim();

  return res.status(200).json({
    message: wasUpdated ? 'Review successfully updated' : 'Review successfully added',
    reviews: book.reviews
  });
});

registeredUsers.delete('/auth/review/:isbn', (req, res) => {
  const match = findBookByISBN(req.params.isbn);

  if (!match) {
    return res.status(404).json({ message: 'Book not found' });
  }

  const book = match[1];
  const username = req.user.username;

  if (!Object.prototype.hasOwnProperty.call(book.reviews, username)) {
    return res.status(404).json({ message: 'No review by this user was found' });
  }

  delete book.reviews[username];
  return res.status(200).json({ message: 'Review successfully deleted' });
});

module.exports.authenticated = registeredUsers;
module.exports.isValid = isValid;
module.exports.doesExist = doesExist;
module.exports.authenticatedUser = authenticatedUser;
module.exports.users = users;

