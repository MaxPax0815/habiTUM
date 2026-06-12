import { Link } from 'react-router-dom'
import { useAuthContext } from '../auth/useAuthContext'
import { useLogout } from '../auth/useLogout'

const Navbar = () => {
  const { logout } = useLogout()
  const { user } = useAuthContext()

  return (
    <header>
      <div className="container">
        <Link to={user ? "/dashboard" : "/"} className="brand">
          <img src="/logo.png" alt="HabiTUM logo" className="brand-logo" />
          <h1>HabiTUM</h1>
        </Link>
        <nav>
          {/* Show user email and logout button if logged in, otherwise show login/signup links */}
          {user && (
            <div>
              <span>{user.email}</span>
              <button onClick={logout}>Log Out</button>
            </div>
          )}
          {/* Show login/signup links if not logged in */}
          {!user && (
            <div>
              <Link to="/login">Log In</Link>
              <Link to="/signup">Sign Up</Link>
            </div>
          )}
        </nav>
      </div>
    </header>
  )
}

export default Navbar
