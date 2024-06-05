import { Route } from 'electron-router-dom'

import MainScreen from './screens/main'
import SearchForm from './screens/search'
import BatchForm from './screens/batch'
import { MemoryRouter, Routes } from 'react-router-dom'

export default function AppRoutes() {
  return (
    <MemoryRouter>
        <Routes>
          <Route path="/" element={<MainScreen />} />
          <Route path="/search" element={<SearchForm />} />
          <Route path="/batch" element={<BatchForm />} />
        </Routes>
    </MemoryRouter>
  )
}
