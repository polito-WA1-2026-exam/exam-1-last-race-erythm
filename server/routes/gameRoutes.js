import { Router } from 'express';
import { isLoggedIn } from '../middleware/auth.js';
import { getRandomStartDest } from '../dao/networkDAO.js';
import { validateRoute, executeRoute, saveGame, getRanking } from '../dao/gameDAO.js';

const router = Router();

// Helper functions
function sendInvalidRoute(res) {
  res.json({ valid: false, finalScore: 0, steps: [] });
}

function sendValidRoute(res, result) {
  res.json({ valid: true, finalScore: result.finalScore, steps: result.steps });
}

function sendRanking(res, ranking) {
  res.json(ranking);
}

// Route handlers
function handleStart(req, res) {
  const result = getRandomStartDest();
  res.json(result);
}

function handleSubmit(req, res) {
  const { route, startStationId, destStationId } = req.body;

  if (!Array.isArray(route) || !startStationId || !destStationId) {
    return res.status(400).json({ error: 'Missing or invalid fields' });
  } else {
    const valid = validateRoute(route, startStationId, destStationId);

    if (!valid) {
      saveGame(req.user.id, startStationId, destStationId, 0);
      sendInvalidRoute(res);
    } else {
      const result = executeRoute(route);
      saveGame(req.user.id, startStationId, destStationId, result.finalScore);
      sendValidRoute(res, result);
    }
  }
}

function handleRanking(req, res) {
  const ranking = getRanking();
  sendRanking(res, ranking);
}

// Routes
// GET /api/game/start — get random start and destination stations
router.get('/start', isLoggedIn, handleStart);

// POST /api/game/submit — validate and execute route
router.post('/submit', isLoggedIn, handleSubmit);

// GET /api/game/ranking — best score per user (auth required)
router.get('/ranking', isLoggedIn, handleRanking);

export default router;