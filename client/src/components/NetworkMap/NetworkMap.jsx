// NetworkMap.jsx
// SVG network map built from API data.
// Station (x,y) positions are hardcoded layout coordinates — visual placement
// is presentation logic, not business data, so it does not belong in the DB.

import './NetworkMap.css'

// Fixed pixel positions for each station inside the 800×520 viewBox
const POSITIONS = {
  1:  { x: 130, y: 200 },  // Centrale
  2:  { x: 300, y: 65  },  // Porta Velaria
  3:  { x: 460, y: 65  },  // Crocevia del Falco
  4:  { x: 630, y: 65  },  // Piazza delle Lanterne
  5:  { x: 300, y: 200 },  // Fontana Oscura
  6:  { x: 460, y: 200 },  // Borgo Sereno
  7:  { x: 630, y: 200 },  // Viale dei Mosaici
  8:  { x: 460, y: 340 },  // Torre Cinerea
  9:  { x: 630, y: 340 },  // Campo dell'Eco
  10: { x: 45,  y: 460 },  // Stazione del Vento
  11: { x: 200, y: 460 },  // Mercato Antico
  12: { x: 400, y: 460 },  // Giardini Sospesi
  13: { x: 560, y: 460 },  // Ponte dei Sospiri
  14: { x: 720, y: 460 },  // Via delle Stelle
}

// Label anchor and offset so text doesn't overlap the lines
const LABEL_OFFSET = {
  1:  { dx: -12, dy: 4,   anchor: 'end'    },
  2:  { dx: 0,   dy: -14, anchor: 'middle' },
  3:  { dx: 0,   dy: -14, anchor: 'middle' },
  4:  { dx: 0,   dy: -14, anchor: 'middle' },
  5:  { dx: 0,   dy: 20,  anchor: 'middle' },
  6:  { dx: 0,   dy: 20,  anchor: 'middle' },
  7:  { dx: 14,  dy: 4,   anchor: 'start'  },
  8:  { dx: -14, dy: 4,   anchor: 'end'    },
  9:  { dx: 14,  dy: 4,   anchor: 'start'  },
  10: { dx: 0,   dy: 18,  anchor: 'middle' },
  11: { dx: 0,   dy: 18,  anchor: 'middle' },
  12: { dx: 0,   dy: 18,  anchor: 'middle' },
  13: { dx: 0,   dy: 18,  anchor: 'middle' },
  14: { dx: 0,   dy: 18,  anchor: 'middle' },
}

// Build colored line segments from lineStations data
function buildLineSegments(lines, lineStations) {
  const lineMap = {}
  for (const line of lines) lineMap[line.id] = line

  const byLine = {}
  for (const ls of lineStations) {
    if (!byLine[ls.line_id]) byLine[ls.line_id] = []
    byLine[ls.line_id].push(ls)
  }

  const segments = []
  for (const [lineId, stops] of Object.entries(byLine)) {
    const line = lineMap[Number(lineId)]
    if (!line) continue
    const sorted = [...stops].sort((a, b) => a.position - b.position)
    for (let i = 0; i < sorted.length - 1; i++) {
      segments.push({
        from: sorted[i].station_id,
        to: sorted[i + 1].station_id,
        color: line.color,
      })
    }
  }
  return segments
}

// A station is an interchange if it appears on more than one line
function isInterchange(stationId, lineStations) {
  const lines = new Set(
    lineStations.filter(ls => ls.station_id === stationId).map(ls => ls.line_id)
  )
  return lines.size > 1
}

function NetworkMap({ stations = [], lines = [], lineStations = [], showLines = true, highlightIds = [], routePath = [] }) {
  if (!stations.length) return null

  const lineSegments = showLines ? buildLineSegments(lines, lineStations) : []

  return (
    <svg viewBox="0 0 800 510" className="network-map-svg" aria-label="Underground network map">

      {/* Colored line segments (only in Setup / showLines mode) */}
      {lineSegments.map(function(seg, i) {
        const from = POSITIONS[seg.from]
        const to   = POSITIONS[seg.to]
        if (!from || !to) return null
        return (
          <line
            key={i}
            x1={from.x} y1={from.y}
            x2={to.x}   y2={to.y}
            stroke={seg.color}
            strokeWidth="5"
            strokeLinecap="round"
          />
        )
      })}

      {/* Route path — segments selected by the player, drawn in orange */}
      {routePath.length > 1 && routePath.slice(0, -1).map(function(fromId, i) {
        const toId = routePath[i + 1]
        const from = POSITIONS[fromId]
        const to   = POSITIONS[toId]
        if (!from || !to) return null
        return (
          <line
            key={`route-${i}`}
            x1={from.x} y1={from.y}
            x2={to.x}   y2={to.y}
            stroke="#f4a200"
            strokeWidth="4"
            strokeLinecap="round"
            strokeDasharray="8 4"
          />
        )
      })}

      {/* Station dots and labels */}
      {stations.map(function(station) {
        const pos = POSITIONS[station.id]
        if (!pos) return null

        const interchange  = isInterchange(station.id, lineStations)
        const highlighted  = highlightIds.includes(station.id)
        const label        = LABEL_OFFSET[station.id] || { dx: 0, dy: 18, anchor: 'middle' }

        return (
          <g key={station.id}>
            {/* Extra ring marks interchange stations */}
            {interchange && (
              <circle cx={pos.x} cy={pos.y} r={11} fill="white" stroke="#555" strokeWidth="2.5" />
            )}
            <circle
              cx={pos.x} cy={pos.y} r={6}
              fill={highlighted ? '#f4a200' : '#333'}
              stroke="white"
              strokeWidth="2"
            />
            <text
              x={pos.x + label.dx}
              y={pos.y + label.dy}
              textAnchor={label.anchor}
              fontSize="11"
              fill={highlighted ? '#b07000' : '#222'}
              fontWeight={highlighted ? 'bold' : 'normal'}
            >
              {station.name}
            </text>
          </g>
        )
      })}
    </svg>
  )
}

export default NetworkMap
