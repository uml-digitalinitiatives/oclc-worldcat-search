import { NavLink } from 'react-router-dom'

export default function Navigation() {
  return (
    <nav>
      <NavLink to="/" className={({ isActive }) => (isActive ? 'active ':'') + 'link'}>Home</NavLink>
      <NavLink to="/search" className={({ isActive }) => (isActive ? 'active ':'') + 'link'}>Search Individual</NavLink>
      <NavLink to="/batch" className={({ isActive }) => (isActive ? 'active ':'') + 'link'}>Batch Process</NavLink>
    </nav>
  );
}
