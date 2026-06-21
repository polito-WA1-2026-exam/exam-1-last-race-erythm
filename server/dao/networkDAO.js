import db from '../db.js';

export function getNetwork() {
  const lines = db.prepare('SELECT * FROM lines').all();
  const stations = db.prepare('SELECT * FROM stations').all();
  const lineStations = db.prepare('SELECT line_id, station_id, position FROM line_stations ORDER BY line_id, position').all();
  return { lines, stations, lineStations };
}

export function getEvents() {
  return db.prepare('SELECT id, description, effect FROM events').all();
}

export function getSegments() {
  // Returns pairs of adjacent stations (without line info)
  const lineStations = db.prepare(`
    SELECT line_id, station_id, position
    FROM line_stations
    ORDER BY line_id, position
  `).all();

  const segmentSet = new Set();
  const segments = [];

  // Dictionary which inside dictionary for each key we have an array
  // Each key is a Line_ID and for each Line_ID we have all the stations related to that Line_ID
  const byLine = {};
  for (const ls of lineStations) {
    if (!byLine[ls.line_id]) {
      byLine[ls.line_id] = [];
    }
    byLine[ls.line_id].push(ls);
  }

  for (const lineId of Object.keys(byLine)) {  
    const stationsOnLine = byLine[lineId];
    for (let i = 0; i < stationsOnLine.length - 1; i++) {
      const a = stationsOnLine[i].station_id;
      const b = stationsOnLine[i + 1].station_id;
      const key = a < b ? `${a}-${b}` : `${b}-${a}`;
      if (!segmentSet.has(key)) {
        segmentSet.add(key);
        segments.push({ stationA: a, stationB: b });
      }
    }
  }

  return segments;
}

export function getRandomStartDest() {
  // Build adjacency list from segments
  const segments = getSegments();
  const adj = {};

  for (const seg of segments) {
    if (!adj[seg.stationA]) adj[seg.stationA] = [];
    if (!adj[seg.stationB]) adj[seg.stationB] = [];
    adj[seg.stationA].push(seg.stationB);
    adj[seg.stationB].push(seg.stationA);
  }

  const stationIds = Object.keys(adj).map(Number);

  // BFS to find distance between two stations
  function bfsDistance(start, end) {
    const visited = new Set([start]);
    const queue = [[start, 0]];
    while (queue.length > 0) {
      const [current, dist] = queue.shift();
      if (current === end) return dist;
      for (const neighbor of (adj[current] || [])) {
        if (!visited.has(neighbor)) {
          visited.add(neighbor);
          queue.push([neighbor, dist + 1]);
        }
      }
    }
    return -1;
  }

  // Try random pairs until we find one with distance >= 3
  for (let attempt = 0; attempt < 100; attempt++) {
    const i = Math.floor(Math.random() * stationIds.length);
    let j = Math.floor(Math.random() * stationIds.length);
    if (i === j) continue;

    const start = stationIds[i];
    const dest = stationIds[j];
    const dist = bfsDistance(start, dest);

    if (dist >= 3) {
      return { startStationId: start, destStationId: dest };
    }
  }

  // Deterministic fallback: scan all pairs to find any valid one
  for (let i = 0; i < stationIds.length; i++) {
    for (let j = 0; j < stationIds.length; j++) {
      if (i !== j && bfsDistance(stationIds[i], stationIds[j]) >= 3) {
        return { startStationId: stationIds[i], destStationId: stationIds[j] }
      }
    }
  }
  return { startStationId: stationIds[0], destStationId: stationIds[stationIds.length - 1] }
}
