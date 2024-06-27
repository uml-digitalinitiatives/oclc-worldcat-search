import { Route } from 'electron-router-dom';
import { MemoryRouter, Routes } from 'react-router-dom';
import MainScreen from './screens/main';
import SearchForm from './screens/search';
import BatchForm from './screens/batch';

export default function AppRoutes() {
  return (
    <MemoryRouter future={{ v7_startTransition: true }}>
      <Routes>
        <Route path="/" element={<MainScreen />} />
        <Route path="/search" element={<SearchForm />} />
        <Route path="/batch" element={<BatchForm />} />
        <Route path="*" element={<MainScreen />} />
      </Routes>
    </MemoryRouter>
  );
}
