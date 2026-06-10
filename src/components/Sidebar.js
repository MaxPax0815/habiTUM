import { NavLink } from 'react-router-dom'

const Sidebar = () => {
  return (
    <aside className="sidebar">
      <div className="sidebar-brand">
        <div className="sidebar-logo">▰</div>

        <div>
          <h1>Habi<span>TUM</span></h1>
          <p>Turn goals into lasting routines.</p>
        </div>
      </div>

      <nav className="sidebar-nav">
        <NavLink to="/" className="sidebar-link">
          <span>⌂</span>
          <span>Today</span>
        </NavLink>

        <NavLink to="/communities" className="sidebar-link">
          <span>♧</span>
          <span>Communities</span>
        </NavLink>

        <NavLink to="/progress" className="sidebar-link">
          <span>≡</span>
          <span>Progress</span>
        </NavLink>
      </nav>

      <div className="sidebar-user">
        <div className="sidebar-avatar">T</div>

        <div>
          <strong>Tom Müller</strong>
          <p>✦ Premium · Student</p>
        </div>
      </div>
    </aside>
  )
}

export default Sidebar