import { useContext } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { UserContext } from '../../App.jsx'
import './Navbar.css'

function Navbar() {
  const { user, setUser } = useContext(UserContext)
  const navigate = useNavigate()

  function handleLogout() {
    fetch('http://localhost:3001/api/logout', {
      method: 'POST',
      credentials: 'include'
    }).then(() => {
      setUser(null)
      navigate('/')
    })
  }

  return (
    <nav className="navbar navbar-dark px-3" style={{ backgroundColor: '#1a1035' }}>
      <Link className="navbar-brand" to="/">Last Race</Link>
      <div>
        {user ? (
          <>
            <Link className="btn btn-outline-light me-2" to="/ranking">Ranking</Link>
            <span className="text-light me-3">Hello, {user.username}</span>
            <button className="btn btn-outline-light" onClick={handleLogout}>Logout</button>
          </>
        ) : (
          <Link className="btn btn-outline-light" to="/login">Login</Link>
        )}
      </div>
    </nav>
  )
}

export default Navbar
