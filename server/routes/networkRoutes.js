import { Router } from 'express';
import { isLoggedIn } from '../middleware/auth.js';
import { getNetwork, getSegments, getEvents } from '../dao/networkDAO.js';

const router = Router();

// GET /api/network — full network (lines, stations, line_stations)
router.get('/', isLoggedIn, (req, res) => {
  const network = getNetwork();
  res.json(network);
});

// GET /api/network/segments — list of adjacent station pairs
router.get('/segments', isLoggedIn, (req, res) => {
  const segments = getSegments();
  res.json(segments);
});

// GET /api/network/events — list of all events
router.get('/events', isLoggedIn, (req, res) => {
  res.json(getEvents());
});

export default router;
