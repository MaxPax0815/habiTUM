import { Link } from 'react-router-dom'

const Navbar = () => {

  return (
    <header>
      <div className="container">
        <Link to="/" className="brand">
          <img
            src="/logo.png"
            alt="HabiTUM logo"
            className="brand-logo"
          />
          <h1>HabiTUM</h1>
        </Link>
      </div>
    </header>
  )
}

export default Navbar
