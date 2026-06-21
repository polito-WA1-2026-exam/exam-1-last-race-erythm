// App.jsx
// Root component of the app.
// Responsibilities:
//   1. On first load, calls GET /api/me to check if a session already exists.
//   2. Holds the logged-in user in UserContext so all pages can access it.
//   3. Renders the Navbar on every page.
//   4. Defines all Routes and protects authenticated pages with <Navigate>.

import { useState, useEffect, createContext } from 'react'
import { Routes, Route, Navigate } from 'react-router-dom'
import Navbar from './components/navbar/Navbar.jsx'
import Home from './pages/home/Home.jsx'
import Login from './pages/login/Login.jsx'
import Setup from './pages/setup/Setup.jsx'
import Play from './pages/play/Play.jsx'
import Ranking from './pages/ranking/Ranking.jsx'

// ----- Context -----
export const UserContext = createContext(null)

// ----- App -----
function App() {
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)

  // Check if user is already logged in (existing session)
  useEffect(() => {
    fetch('http://localhost:3001/api/me', { credentials: 'include' })
      .then(res => {
        if (res.ok) return res.json()
        return null
      })
      .then(data => {
        if (data) setUser(data)
        setLoading(false)
      })
      .catch(() => setLoading(false))
  }, [])

  if (loading) return <p className="text-center mt-5">Loading...</p>

  return (
    <UserContext.Provider value={{ user, setUser }}>
      <Navbar />
      <div className="container mt-4">
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/login" element={<Login />} />
          <Route path="/setup" element={user ? <Setup /> : <Navigate to="/login" />} />
          <Route path="/play" element={user ? <Play /> : <Navigate to="/login" />} />
          <Route path="/ranking" element={user ? <Ranking /> : <Navigate to="/login" />} />
        </Routes>
      </div>
    </UserContext.Provider>
  )
}

export default App
