require('dotenv').config();
const express = require('express');
const session = require('express-session');
const passport = require('passport');
const GoogleStrategy = require('passport-google-oauth20').Strategy;
const { createOrUpdateUser, findUserById } = require('./db');

const app = express();
const PORT = process.env.PORT || 3000;

const requiredEnv = [
  'GOOGLE_CLIENT_ID',
  'GOOGLE_CLIENT_SECRET',
  'GOOGLE_CALLBACK_URL',
  'SESSION_SECRET',
];

const missingEnv = requiredEnv.filter((key) => !process.env[key]);
if (missingEnv.length) {
  console.warn(`Missing environment variables: ${missingEnv.join(', ')}`);
  console.warn('Please configure .env before starting Google login.');
}

app.use(
  session({
    secret: process.env.SESSION_SECRET || 'dev_secret_change_me',
    resave: false,
    saveUninitialized: false,
  })
);

app.use(passport.initialize());
app.use(passport.session());

passport.use(
  new GoogleStrategy(
    {
      clientID: process.env.GOOGLE_CLIENT_ID || 'missing_client_id',
      clientSecret: process.env.GOOGLE_CLIENT_SECRET || 'missing_client_secret',
      callbackURL: process.env.GOOGLE_CALLBACK_URL || 'http://localhost:3000/auth/google/callback',
    },
    (_accessToken, _refreshToken, profile, done) => {
      try {
        const user = createOrUpdateUser(profile);
        done(null, user.id);
      } catch (error) {
        done(error);
      }
    }
  )
);

passport.serializeUser((userId, done) => done(null, userId));
passport.deserializeUser((userId, done) => {
  try {
    const user = findUserById(userId);
    done(null, user || false);
  } catch (error) {
    done(error);
  }
});

function requireAuth(req, res, next) {
  if (req.isAuthenticated && req.isAuthenticated()) {
    return next();
  }
  return res.redirect('/');
}

app.get('/', (req, res) => {
  if (req.isAuthenticated && req.isAuthenticated()) {
    return res.redirect('/dashboard');
  }

  return res.send(`
    <!doctype html>
    <html>
      <head>
        <meta charset="utf-8" />
        <title>GIP Portal Login</title>
        <style>
          body { font-family: Arial, sans-serif; background: #f4f6fb; display:flex; min-height:100vh; align-items:center; justify-content:center; margin:0; }
          .card { background:#fff; padding:32px; border-radius:14px; box-shadow:0 8px 24px rgba(0,0,0,0.08); width:340px; text-align:center; }
          .btn { display:inline-block; padding:12px 16px; background:#1a73e8; color:#fff; border-radius:8px; text-decoration:none; font-weight:600; }
          p { color:#555; }
        </style>
      </head>
      <body>
        <div class="card">
          <h1>GIP Portal</h1>
          <p>Register/Login gamit ang Gmail, pagkatapos diretso sa dashboard.</p>
          <a class="btn" href="/auth/google">Continue with Gmail</a>
        </div>
      </body>
    </html>
  `);
});

app.get('/auth/google', passport.authenticate('google', { scope: ['profile', 'email'] }));

app.get(
  '/auth/google/callback',
  passport.authenticate('google', { failureRedirect: '/' }),
  (_req, res) => {
    res.redirect('/dashboard');
  }
);

app.get('/dashboard', requireAuth, (req, res) => {
  const user = req.user;

  return res.send(`
    <!doctype html>
    <html>
      <head>
        <meta charset="utf-8" />
        <title>Dashboard</title>
        <style>
          body { font-family: Arial, sans-serif; background: #eef2ff; margin:0; }
          .container { max-width:800px; margin:50px auto; background:#fff; padding:28px; border-radius:14px; box-shadow:0 8px 24px rgba(0,0,0,0.08); }
          .header { display:flex; align-items:center; gap:16px; }
          img { width:56px; height:56px; border-radius:999px; }
          .logout { margin-top:24px; display:inline-block; color:#b42318; text-decoration:none; font-weight:600; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            ${user.photo_url ? `<img src="${user.photo_url}" alt="Profile Photo" />` : ''}
            <div>
              <h1>Welcome, ${user.name}</h1>
              <p>${user.email}</p>
            </div>
          </div>
          <p>Naka-login ka na sa dashboard gamit ang Gmail account mo.</p>
          <a class="logout" href="/logout">Logout</a>
        </div>
      </body>
    </html>
  `);
});

app.get('/logout', (req, res, next) => {
  req.logout((error) => {
    if (error) {
      return next(error);
    }
    req.session.destroy(() => {
      res.redirect('/');
    });
  });
});

app.listen(PORT, () => {
  console.log(`Server running at http://localhost:${PORT}`);
});
