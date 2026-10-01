'use strict';

const express = require('express');
const session = require('express-session');
const jwt = require('jsonwebtoken');

const customerRoutes = require('./router/auth_users.js').authenticated;
const generalRoutes = require('./router/general.js').general;

const app = express();
const PORT = Number(process.env.PORT) || 5000;
const SESSION_SECRET = process.env.SESSION_SECRET || 'book-review-session-secret';
const JWT_SECRET = process.env.JWT_SECRET || 'book-review-access-secret';

app.disable('x-powered-by');
app.use(express.json());
app.use(express.urlencoded({ extended: false }));

app.use(
  '/customer',
  session({
    secret: SESSION_SECRET,
    resave: false,
    saveUninitialized: false,
    cookie: {
      httpOnly: true,
      sameSite: 'lax',
      secure: process.env.NODE_ENV === 'production',
      maxAge: 60 * 60 * 1000
    }
  })
);

app.use('/customer/auth', (req, res, next) => {
  const authorization = req.session.authorization;

  if (!authorization || !authorization.accessToken) {
    return res.status(401).json({ message: 'User is not logged in' });
  }

  try {
    req.user = jwt.verify(authorization.accessToken, JWT_SECRET);
    return next();
  } catch (error) {
    req.session.authorization = null;
    return res.status(401).json({ message: 'User authentication has expired' });
  }
});

app.use('/customer', customerRoutes);
app.use('/', generalRoutes);

app.use((req, res) => {
  return res.status(404).json({ message: 'Route not found' });
});

app.use((error, req, res, next) => {
  if (res.headersSent) {
    return next(error);
  }

  if (error instanceof SyntaxError && error.status === 400 && 'body' in error) {
    return res.status(400).json({ message: 'Request body must contain valid JSON' });
  }

  console.error(error);
  return res.status(500).json({ message: 'Internal server error' });
});

if (require.main === module) {
  app.listen(PORT, () => {
    console.log(`Book review server is running at http://localhost:${PORT}`);
  });
}

module.exports = { app, JWT_SECRET };

