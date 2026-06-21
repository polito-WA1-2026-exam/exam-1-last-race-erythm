import { useState, useEffect } from 'react'
import './Ranking.css'

function Ranking() {
  const [ranking, setRanking] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  // Load ranking on mount
  useEffect(() => {
    fetch('http://localhost:3001/api/game/ranking', { credentials: 'include' })
      .then(res => {
        if (!res.ok) throw new Error('Failed to load ranking')
        return res.json()
      })
      .then(data => {
        setRanking(data)
        setLoading(false)
      })
      .catch(() => {
        setError('Could not load ranking.')
        setLoading(false)
      })
  }, [])

  // Render 
  if (loading) return <p className="text-center mt-5">Loading...</p>
  if (error) return <p className="text-danger text-center mt-5">{error}</p>

  return (
    <div className="row justify-content-center">
      <div className="col-md-6">
        <h2 className="mb-4">Leaderboard</h2>

        {ranking.length === 0 ? (
          <p className="text-muted">No games played yet.</p>
        ) : (
          <table className="table table-striped">
            <thead>
              <tr>
                <th>#</th>
                <th>Player</th>
                <th>Best Score</th>
              </tr>
            </thead>
            <tbody>
              {ranking.map((row, index) => (
                <tr key={row.username}>
                  <td>{index + 1}</td>
                  <td>{row.username}</td>
                  <td>{row.best_score} coins</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  )
}

export default Ranking
