import { useContext } from 'react'
import { useNavigate } from 'react-router-dom'
import { UserContext } from '../../App.jsx'
import './Home.css'

function Home() {
  const { user } = useContext(UserContext)
  const navigate = useNavigate()

  function handleStart() {
    if (user) {
      navigate('/setup')
    } else {
      navigate('/login')
    }
  }

  return (
    <div className="row justify-content-center">
      <div className="col-md-8">
        <h1 className="mb-1">Last Race</h1>
        <p className="lead text-muted mb-4">
          Navigate an underground metro network against the clock. Build the right route — and hope for good luck.
        </p>

        <h5 className="mb-3">How to Play</h5>

        <div className="mb-2 d-flex gap-2">
          <span className="badge bg-secondary align-self-start" style={{ minWidth: 24 }}>1</span>
          <div>
            <strong>Setup</strong> — Study the full network map. All lines, stations, and connections are shown. Memorise as much as you can.
          </div>
        </div>

        <div className="mb-2 d-flex gap-2">
          <span className="badge bg-secondary align-self-start" style={{ minWidth: 24 }}>2</span>
          <div>
            <strong>Planning (90 seconds)</strong> — You get a start and a destination station, at least 3 segments apart. The map now shows only stations — no lines. Build your route by clicking segments from the list before time runs out.
          </div>
        </div>

        <div className="mb-2 d-flex gap-2">
          <span className="badge bg-secondary align-self-start" style={{ minWidth: 24 }}>!</span>
          <div className="text-muted" style={{ fontSize: '0.9rem' }}>
            Each segment can only be used once. Line changes are only allowed at <strong>interchange stations</strong> (marked with a double circle on the map). An incomplete or invalid route means you lose all your coins.
          </div>
        </div>

        <div className="mb-2 d-flex gap-2">
          <span className="badge bg-secondary align-self-start" style={{ minWidth: 24 }}>3</span>
          <div>
            <strong>Execution</strong> — Your route is validated and played out step by step. Each segment triggers a random event that adds or removes coins from your starting balance of 20.
          </div>
        </div>

        <div className="mb-4 d-flex gap-2">
          <span className="badge bg-secondary align-self-start" style={{ minWidth: 24 }}>4</span>
          <div>
            <strong>Result</strong> — Your score is the coins you have left (minimum 0). Your best score appears in the global ranking.
          </div>
        </div>

        {user ? (
          <button className="btn btn-success btn-lg" onClick={handleStart}>Play Now</button>
        ) : (
          <div>
            <p className="text-muted mb-2" style={{ fontSize: '0.9rem' }}>You need to log in to play.</p>
            <button className="btn btn-primary btn-lg" onClick={handleStart}>Login to Play</button>
          </div>
        )}
      </div>
    </div>
  )
}

export default Home
