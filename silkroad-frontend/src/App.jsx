import { Routes, Route } from 'react-router-dom'
import Navbar from './components/Navbar'
import SightList from './pages/SightList'
import SightDetail from './pages/SightDetail'
import Profile from './pages/Profile'
import Login from './pages/Login'
import Register from './pages/Register'

function App() {
  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      <main className="container mx-auto px-4 py-8">
        <Routes>
          <Route path="/" element={<SightList />} />
          <Route path="/sights/:id" element={<SightDetail />} />
          <Route path="/profile" element={<Profile />} />
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
        </Routes>
      </main>
    </div>
  )
}

export default App