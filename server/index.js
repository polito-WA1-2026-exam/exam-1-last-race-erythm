import express from 'express';
import cors from 'cors';
import session from 'express-session';
import passport from 'passport';
import { Strategy as LocalStrategy } from 'passport-local';
import { getUserById, getUser } from './dao/userDAO.js';
import authRouter from './routes/authRoutes.js';
import networkRouter from './routes/networkRoutes.js';
import gameRouter from './routes/gameRoutes.js';

const app = express();
const port = 3001;
const SESSION_SECRET = process.env.SESSION_SECRET || 'last-race-secret-key';

// Middleware
app.use(cors({ origin: 'http://localhost:5173', credentials: true }));
app.use(express.json());
app.use(session({ secret: SESSION_SECRET, resave: false, saveUninitialized: false }));
app.use(passport.initialize());
app.use(passport.session());

// LocalStrategy: tell passport how to verify username + password
passport.use(new LocalStrategy(function(username, password, done) {
  const user = getUser(username, password);
  if (!user) return done(null, false);
  return done(null, user);
}));

function handleSerializeUser(user, done) {
  done(null, user.id);
}

function handleDeserializeUser(id, done) {
  const user = getUserById(id);
  done(null, user);
}

passport.serializeUser(handleSerializeUser);
passport.deserializeUser(handleDeserializeUser);

// Routes
app.use('/api', authRouter);
app.use('/api/network', networkRouter);
app.use('/api/game', gameRouter);

app.listen(port);