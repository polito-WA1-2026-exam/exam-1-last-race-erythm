import db from './db.js';
import { scryptSync, randomBytes } from 'crypto';

// Drop and recreate all tables to ensure a clean schema every time
db.exec(`
  DROP TABLE IF EXISTS games;
  DROP TABLE IF EXISTS line_stations;
  DROP TABLE IF EXISTS users;
  DROP TABLE IF EXISTS events;
  DROP TABLE IF EXISTS stations;
  DROP TABLE IF EXISTS lines;
`);

// Create tables
db.exec(`
  CREATE TABLE IF NOT EXISTS lines (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    color TEXT NOT NULL
  );

  CREATE TABLE IF NOT EXISTS stations (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL
  );

  CREATE TABLE IF NOT EXISTS line_stations (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    line_id INTEGER NOT NULL,
    station_id INTEGER NOT NULL,
    position INTEGER NOT NULL,
    FOREIGN KEY (line_id) REFERENCES lines(id),
    FOREIGN KEY (station_id) REFERENCES stations(id)
  );

  CREATE TABLE IF NOT EXISTS events (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    description TEXT NOT NULL,
    effect INTEGER NOT NULL
  );

  CREATE TABLE IF NOT EXISTS users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    username TEXT NOT NULL UNIQUE,
    password TEXT NOT NULL,
    salt TEXT NOT NULL
  );

  CREATE TABLE IF NOT EXISTS games (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL,
    start_station_id INTEGER NOT NULL,
    dest_station_id INTEGER NOT NULL,
    score INTEGER NOT NULL,
    created_at TEXT DEFAULT (datetime('now')),
    FOREIGN KEY (user_id) REFERENCES users(id)
  );
`);

// Lines
const lines = [
  { name: 'Red Line',    color: '#e63946' },
  { name: 'Blue Line',   color: '#457b9d' },
  { name: 'Green Line',  color: '#2a9d8f' },
  { name: 'Yellow Line', color: '#e9c46a' },
  { name: 'Purple Line', color: '#7b2d8b' },
];

const insertLine = db.prepare('INSERT INTO lines (name, color) VALUES (?, ?)');
for (const line of lines) {
  insertLine.run(line.name, line.color);
}

// Stations (14 total)
const stations = [
  'Centrale',             // 1
  'Porta Velaria',        // 2
  'Crocevia del Falco',   // 3
  'Piazza delle Lanterne',// 4
  'Fontana Oscura',       // 5
  'Borgo Sereno',         // 6
  'Viale dei Mosaici',    // 7
  'Torre Cinerea',        // 8
  "Campo dell'Eco",       // 9
  'Stazione del Vento',   // 10
  'Mercato Antico',       // 11
  'Giardini Sospesi',     // 12
  'Ponte dei Sospiri',    // 13
  'Via delle Stelle',     // 14
];

const insertStation = db.prepare('INSERT INTO stations (name) VALUES (?)');
for (const name of stations) {
  insertStation.run(name);
}

// Line-station connections (which stations are on which line, in order)
// Red:    Centrale(1) - Porta Velaria(2) - Crocevia del Falco(3) - Piazza delle Lanterne(4)
// Blue:   Centrale(1) - Fontana Oscura(5) - Borgo Sereno(6) - Viale dei Mosaici(7)
// Green:  Porta Velaria(2) - Fontana Oscura(5) - Torre Cinerea(8) - Campo dell'Eco(9)
// Yellow: Piazza delle Lanterne(4) - Torre Cinerea(8) - Viale dei Mosaici(7) - Campo dell'Eco(9)
// Purple: Stazione del Vento(10) - Mercato Antico(11) - Centrale(1) - Giardini Sospesi(12) - Ponte dei Sospiri(13) - Via delle Stelle(14)
// Interchange stations: Centrale(1), Porta Velaria(2), Fontana Oscura(5), Piazza delle Lanterne(4), Torre Cinerea(8), Viale dei Mosaici(7), Campo dell'Eco(9)

const lineStations = [
  // Red Line (id=1)
  { line_id: 1, station_id: 1, position: 1 },
  { line_id: 1, station_id: 2, position: 2 },
  { line_id: 1, station_id: 3, position: 3 },
  { line_id: 1, station_id: 4, position: 4 },
  // Blue Line (id=2)
  { line_id: 2, station_id: 1, position: 1 },
  { line_id: 2, station_id: 5, position: 2 },
  { line_id: 2, station_id: 6, position: 3 },
  { line_id: 2, station_id: 7, position: 4 },
  // Green Line (id=3)
  { line_id: 3, station_id: 2, position: 1 },
  { line_id: 3, station_id: 5, position: 2 },
  { line_id: 3, station_id: 8, position: 3 },
  { line_id: 3, station_id: 9, position: 4 },
  // Yellow Line (id=4)
  { line_id: 4, station_id: 4, position: 1 },
  { line_id: 4, station_id: 8, position: 2 },
  { line_id: 4, station_id: 7, position: 3 },
  { line_id: 4, station_id: 9, position: 4 },
  // Purple Line (id=5)
  { line_id: 5, station_id: 10, position: 1 },
  { line_id: 5, station_id: 11, position: 2 },
  { line_id: 5, station_id: 1,  position: 3 },
  { line_id: 5, station_id: 12, position: 4 },
  { line_id: 5, station_id: 13, position: 5 },
  { line_id: 5, station_id: 14, position: 6 },
];

const insertLineStation = db.prepare('INSERT INTO line_stations (line_id, station_id, position) VALUES (?, ?, ?)');
for (const ls of lineStations) {
  insertLineStation.run(ls.line_id, ls.station_id, ls.position);
}

// Events (8 total, effects from -4 to +4)
const events = [
  { description: 'Quiet journey',    effect:  0 },
  { description: 'Wrong platform',   effect: -2 },
  { description: 'Kind passenger',   effect:  1 },
  { description: 'Signal delay',     effect: -1 },
  { description: 'Lucky ticket',     effect:  3 },
  { description: 'Crowded carriage', effect: -3 },
  { description: 'Express service',  effect:  2 },
  { description: 'Emergency stop',   effect: -4 },
  { description: 'Golden pass',      effect:  4 },
];

const insertEvent = db.prepare('INSERT INTO events (description, effect) VALUES (?, ?)');
for (const event of events) {
  insertEvent.run(event.description, event.effect);
}

// Users (3 registered users)
function hashPassword(password) {
  const salt = randomBytes(16).toString('hex');
  const hash = scryptSync(password, salt, 32).toString('hex');
  return { hash, salt };
}

const users = [
  { username: 'user1',              password: 'User1@pass'         },  // user_id=1
  { username: 'user2',              password: 'User2@pass'         },  // user_id=2
  { username: 'erfan.moghadasian',  password: 'Erf@nmoghadasian1'  },  // user_id=3
];

const insertUser = db.prepare('INSERT INTO users (username, password, salt) VALUES (?, ?, ?)');
for (const u of users) {
  const { hash, salt } = hashPassword(u.password);
  insertUser.run(u.username, hash, salt);
}

// Games — user1 and user2 have prior games; erfan.moghadasian has none yet
const insertGame = db.prepare('INSERT INTO games (user_id, start_station_id, dest_station_id, score) VALUES (?, ?, ?, ?)');

// user1: best score = 22
insertGame.run(1, 1, 9,  12);
insertGame.run(1, 4, 11, 22);

// user2: best score = 14
insertGame.run(2, 3, 12, 14);
insertGame.run(2, 5, 14, 9);

console.log('Database seeded successfully!');
