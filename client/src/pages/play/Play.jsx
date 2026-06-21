import { useState, useEffect, useRef } from 'react'
import NetworkMap from '../../components/NetworkMap/NetworkMap.jsx'
import './Play.css'

function Play() {
  const [phase, setPhase] = useState('planning')

  // ----- Planning state -----
  const [startId, setStartId] = useState(null)
  const [destId, setDestId] = useState(null)
  const [segments, setSegments] = useState([])
  const [stations, setStations] = useState([])
  const [lines, setLines] = useState([])
  const [lineStations, setLineStations] = useState([])
  const [route, setRoute] = useState([])
  const [timeLeft, setTimeLeft] = useState(90)
  const [dataReady, setDataReady] = useState(false)
  const [error, setError] = useState('')

  // ----- Execution state -----
  const [steps, setSteps] = useState([])
  const [stepIndex, setStepIndex] = useState(0)
  const [finalScore, setFinalScore] = useState(0)
  const [valid, setValid] = useState(true)

  // Captures route/startId/destId at the moment the player submits — prevents
  // the execution useEffect from re-firing if state changes while executing
  const submitPayloadRef = useRef(null)
  // Prevents double-submit caused by React StrictMode running effects twice
  const submittedRef = useRef(false)

  // Load game data when planning phase starts — single Promise.all to avoid duplicate fetches
  useEffect(function() {
    if (phase !== 'planning') return

    setRoute([])
    setTimeLeft(90)
    setDataReady(false)
    setError('')
    submittedRef.current = false

    Promise.all([
      fetch('http://localhost:3001/api/game/start', { credentials: 'include' }).then(r => r.json()),
      fetch('http://localhost:3001/api/network/segments', { credentials: 'include' }).then(r => r.json()),
      fetch('http://localhost:3001/api/network', { credentials: 'include' }).then(r => r.json()),
    ]).then(function([startData, segsData, networkData]) {
      setStartId(startData.startStationId)
      setDestId(startData.destStationId)
      setSegments(segsData)
      setStations(networkData.stations)
      setLines(networkData.lines || [])
      setLineStations(networkData.lineStations || [])
      setDataReady(true)
    }).catch(function() {
      setError('Failed to load game data. Please refresh and try again.')
    })

  }, [phase])

  // 90-second countdown — only starts after game data has loaded
  useEffect(function() {
    if (phase !== 'planning' || !dataReady) return

    if (timeLeft === 0) {
      submitPayloadRef.current = { route, startId, destId }
      setPhase('execution')
      return
    }

    const timer = setTimeout(function() {
      setTimeLeft(timeLeft - 1)
    }, 1000)

    return function() { clearTimeout(timer) }
  }, [phase, timeLeft, dataReady])

  // Send route to server when execution phase starts — guard prevents double-submit
  useEffect(function() {
    if (phase !== 'execution') return
    if (submittedRef.current) return
    submittedRef.current = true

    const payload = submitPayloadRef.current || {}
    fetch('http://localhost:3001/api/game/submit', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify({ route: payload.route, startStationId: payload.startId, destStationId: payload.destId })
    })
      .then(function(r) { return r.json() })
      .then(function(data) {
        setValid(data.valid)
        setSteps(data.steps)
        setFinalScore(data.finalScore)
        setStepIndex(0)
        if (!data.valid) setPhase('result')
      })
      .catch(function() {
        setError('Server error. Please try again.')
        setPhase('planning')
      })

  }, [phase])

  // Helpers
  function getStationName(id) {
    const s = stations.find(function(s) { return s.id === id })
    return s ? s.name : '?'
  }

  function isSegmentInRoute(segA, segB) {
    for (let i = 0; i < route.length - 1; i++) {
      if ((route[i] === segA && route[i+1] === segB) || (route[i] === segB && route[i+1] === segA)) {
        return true
      }
    }
    return false
  }

  function isLastSegment(segA, segB) {
    const len = route.length
    if (len < 2) return false
    const last = route[len - 1]
    const secondLast = route[len - 2]
    return (last === segA && secondLast === segB) || (last === segB && secondLast === segA)
  }

  function handleSegmentClick(segA, segB) {
    setError('')

    // Click on last segment - undo it
    if (isLastSegment(segA, segB)) {
      setRoute(route.slice(0, -1))
      return
    }

    // Already used - block
    if (isSegmentInRoute(segA, segB)) {
      setError('This segment is already used in your route.')
      return
    }

    // Empty route - must start from startId
    if (route.length === 0) {
      if (segA !== startId && segB !== startId) {
        setError(`Your route must start from ${getStationName(startId)}.`)
        return
      }
      // Put startId first
      if (segA === startId) {
        setRoute([segA, segB])
      } else {
        setRoute([segB, segA])
      }
      return
    }

    // Extend from current end
    const last = route[route.length - 1]
    if (last === segA) {
      setRoute([...route, segB])
    } else if (last === segB) {
      setRoute([...route, segA])
    } else {
      setError('This segment does not connect to the end of your current route.')
    }
  }

  function handleNextStep() {
    if (stepIndex < steps.length - 1) {
      setStepIndex(stepIndex + 1)
    } else {
      setPhase('result')
    }
  }

  // Render — Planning
  if (phase === 'planning') {
    return (
      <div>
        <div className="d-flex justify-content-between align-items-center mb-3">
          <h2>Planning Phase</h2>
          <span className={`badge fs-5 ${timeLeft <= 30 ? 'bg-danger' : 'bg-secondary'}`}>
            {timeLeft}s
          </span>
        </div>

        {error && <div className="alert alert-warning">{error}</div>}

        {startId && (
          <div className="alert alert-info">
            <strong>From:</strong> {getStationName(startId)} &nbsp;→&nbsp;
            <strong>To:</strong> {getStationName(destId)}
          </div>
        )}

        <div className="row g-3 mb-3">
          {/* Left: station map without lines */}
          <div className="col-md-8">
            <NetworkMap
              stations={stations}
              lines={lines}
              lineStations={lineStations}
              showLines={false}
              highlightIds={[startId, destId].filter(Boolean)}
              routePath={route}
            />
          </div>

          {/* Right: route display + scrollable segment list */}
          <div className="col-md-4 d-flex flex-column">
            <div className="mb-2">
              <strong>Your route: </strong>
              {route.length === 0
                ? <span className="text-muted">Select a segment below to start</span>
                : route.map(function(id, i) {
                    return (
                      <span key={i}>
                        {i > 0 && <span className="text-muted mx-1">→</span>}
                        <span className="badge" style={{ backgroundColor: i === 0 || i === route.length - 1 ? '#e9a800' : '#6c757d', color: '#fff' }}>
                          {getStationName(id)}
                        </span>
                      </span>
                    )
                  })
              }
            </div>

            <h6>All Segments</h6>
            <div className="segment-scroll">
              <div className="segment-grid">
                {segments.map(function(seg, i) {
                  const inRoute = isSegmentInRoute(seg.stationA, seg.stationB)
                  const isLast  = isLastSegment(seg.stationA, seg.stationB)
                  return (
                    <button
                      key={i}
                      className={`btn btn-sm segment-btn ${isLast ? 'btn-warning' : inRoute ? 'btn-primary' : 'btn-outline-secondary'}`}
                      onClick={function() { handleSegmentClick(seg.stationA, seg.stationB) }}
                    >
                      {getStationName(seg.stationA)}
                      <span className="segment-dash">—</span>
                      {getStationName(seg.stationB)}
                    </button>
                  )
                })}
              </div>
            </div>

            <div className="text-center mt-3">
              <button
                className="btn btn-primary btn-lg"
                onClick={function() { submitPayloadRef.current = { route, startId, destId }; setPhase('execution') }}
                disabled={route.length < 2}
              >
                Submit Route
              </button>
            </div>
          </div>
        </div>
      </div>
    )
  }

  // Render — Execution
  if (phase === 'execution') {
    if (steps.length === 0) return <p className="text-center mt-5">Processing...</p>

    const step = steps[stepIndex]

    return (
      <div>
        <h2 className="mb-3">Execution Phase</h2>
        <p><strong>Step {stepIndex + 1} of {steps.length}</strong></p>

        <div className="card mb-3">
          <div className="card-body">
            <h5>{getStationName(step.from)} → {getStationName(step.to)}</h5>
            <p>Event: <strong>{step.event}</strong></p>
            <p>
              Effect:{' '}
              <span className={step.effect >= 0 ? 'text-success' : 'text-danger'}>
                {step.effect >= 0 ? '+' : ''}{step.effect} coins
              </span>
            </p>
            <p>Coins now: <strong>{step.coinsAfter}</strong></p>
          </div>
        </div>

        <button className="btn btn-primary" onClick={handleNextStep}>
          {stepIndex < steps.length - 1 ? 'Next Step' : 'See Result'}
        </button>
      </div>
    )
  }

  // Render — Result
  return (
    <div className="text-center mt-4">
      <h2 className="mb-3">Game Over</h2>

      {valid
        ? <div className="alert alert-success">Journey complete!</div>
        : <div className="alert alert-danger">Invalid route — you lose all your coins.</div>
      }

      <h3 className="mb-4">Final Score: <strong>{finalScore} coins</strong></h3>

      <button className="btn btn-success btn-lg" onClick={function() { setPhase('planning') }}>
        Play Again
      </button>
    </div>
  )
}

export default Play
