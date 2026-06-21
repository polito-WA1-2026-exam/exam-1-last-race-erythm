import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import NetworkMap from '../../components/NetworkMap/NetworkMap.jsx'
import './Setup.css'

function Setup() {
  const navigate = useNavigate()
  const [network, setNetwork] = useState(null)

  useEffect(function() {
    fetch('http://localhost:3001/api/network', { credentials: 'include' })
      .then(function(r) { return r.json() })
      .then(function(data) { setNetwork(data) })
      .catch(function() {})
  }, [])

  return (
    <div>
      <h2 className="mb-2">Network Map</h2>
      <p className="text-muted mb-3">
        Study the network carefully before starting. Once you start, you will not see the lines — only the station pairs.
      </p>

      {network ? (
        <>
          <NetworkMap
            stations={network.stations}
            lines={network.lines}
            lineStations={network.lineStations}
            showLines={true}
          />
          <div className="d-flex flex-wrap gap-3 mt-3 mb-1">
            {network.lines.map(function(line) {
              return (
                <span key={line.id} className="d-flex align-items-center gap-2">
                  <span style={{ display: 'inline-block', width: 28, height: 5, backgroundColor: line.color, borderRadius: 3 }} />
                  <span style={{ fontSize: '0.9rem' }}>{line.name}</span>
                </span>
              )
            })}
          </div>
        </>
      ) : (
        <p className="text-center text-muted mt-4">Loading map...</p>
      )}

      <button className="btn btn-success btn-lg mt-3" onClick={function() { navigate('/play') }}>
        Start Game
      </button>
    </div>
  )
}

export default Setup
