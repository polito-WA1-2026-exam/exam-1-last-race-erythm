import db from '../db.js';

// Cache static network topology once at module load — line_stations never changes at runtime.
// This replaces the two per-call DB queries with a single startup read.
const _ls = db.prepare('SELECT line_id, station_id, position FROM line_stations ORDER BY line_id, position').all();
const _stationLines = {};   // station_id → Set<line_id>
const _lineOrder    = {};   // line_id    → [station_id, ...] in position order
for (const row of _ls) {
  if (!_stationLines[row.station_id]) _stationLines[row.station_id] = new Set();
  _stationLines[row.station_id].add(row.line_id);
  if (!_lineOrder[row.line_id]) _lineOrder[row.line_id] = [];
  _lineOrder[row.line_id].push(row.station_id);
}

export function validateRoute(route, startStationId, destStationId) {
  if (!route || route.length < 2) return false;
  if (route[0] !== startStationId) return false;
  if (route[route.length - 1] !== destStationId) return false;

  // Check for duplicate segments (same pair used more than once)
  const usedSegments = new Set();
  for (let i = 0; i < route.length - 1; i++) {
    const a = route[i];
    const b = route[i + 1];
    const key = a < b ? `${a}-${b}` : `${b}-${a}`;
    if (usedSegments.has(key)) return false;
    usedSegments.add(key);
  }

  // Use module-level cached topology — no DB queries per call
  let currentLine = null;

  for (let i = 0; i < route.length - 1; i++) {
    const a = route[i];
    const b = route[i + 1];

    const linesA = _stationLines[a] || new Set();
    const linesB = _stationLines[b] || new Set();

    // Find lines that contain both a and b as adjacent stops
    let validLineForSegment = null;
    for (const lineId of linesA) {
      if (!linesB.has(lineId)) continue;
      const ordered = _lineOrder[lineId];
      const posA = ordered.indexOf(a);
      const posB = ordered.indexOf(b);
      if (posA !== -1 && posB !== -1 && Math.abs(posA - posB) === 1) {
        validLineForSegment = lineId;
        break;
      }
    }

    if (validLineForSegment === null) return false;

    // Line change is only allowed at interchange stations
    if (currentLine !== null && currentLine !== validLineForSegment) {
      // a must be an interchange station (served by more than one line)
      if (!_stationLines[a] || _stationLines[a].size < 2) return false;
    }

    currentLine = validLineForSegment;
  }

  return true;
}

export function executeRoute(route) {
  const events = db.prepare('SELECT * FROM events').all();
  let coins = 20;
  const steps = [];

  for (let i = 0; i < route.length - 1; i++) {
    const randomEvent = events[Math.floor(Math.random() * events.length)];
    coins += randomEvent.effect;

    steps.push({
      from: route[i],
      to: route[i + 1],
      event: randomEvent.description,
      effect: randomEvent.effect,
      coinsAfter: coins,
    });
  }

  // Spec: "If the final score is negative, it will be stored and shown as zero"
  const finalScore = coins < 0 ? 0 : coins;
  return { steps, finalScore };
}

export function saveGame(userId, startStationId, destStationId, score) {
  db.prepare(
    'INSERT INTO games (user_id, start_station_id, dest_station_id, score) VALUES (?, ?, ?, ?)'
  ).run(userId, startStationId, destStationId, score);
}

export function getRanking() {
  return db.prepare(`
    SELECT u.username, MAX(g.score) AS best_score
    FROM games g
    JOIN users u ON g.user_id = u.id
    GROUP BY g.user_id
    ORDER BY best_score DESC
  `).all();
}
