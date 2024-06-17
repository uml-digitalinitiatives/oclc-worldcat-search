import { NavLink } from 'react-router-dom';

export default function Navigation() {
  return (
    <nav>
      <NavLink to="/" className={({ isActive }) => (isActive ? 'active link' : 'link')}>Home</NavLink>
      <NavLink to="/search" className={({ isActive }) => (isActive ? 'active link' : 'link')}>Search Individual</NavLink>
      <NavLink to="/batch" className={({ isActive }) => (isActive ? 'active link' : 'link')}>Batch Process</NavLink>
    </nav>
  );
}
