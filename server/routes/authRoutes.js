import { Router } from 'express';
import passport from 'passport';

const router = Router();

// Login route handler — uses passport LocalStrategy defined in index.js
function handleLogin(req, res, next) {
  passport.authenticate('local', function(err, user) {
    if (err) return next(err);
    if (!user) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }
    req.login(user, function(loginErr) {
      if (loginErr) return next(loginErr);
      res.json({ id: user.id, username: user.username });
    });
  })(req, res, next);
}

// Logout route handler
function handleLogout(req, res) {
  req.logout(function () {
    res.status(204).end();
  });
}

// Current user route handler
function handleMe(req, res) {
  if (req.isAuthenticated()) {
    res.json({ id: req.user.id, username: req.user.username });
  } else {
    res.status(401).json({ error: 'Not authenticated' });
  }
}

// POST /api/login — login
router.post('/login', handleLogin);

// POST /api/logout — logout
router.post('/logout', handleLogout);

// GET /api/me — get current user
router.get('/me', handleMe);

export default router;
