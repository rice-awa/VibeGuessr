import { Routes, Route } from 'react-router-dom'
import Home from './pages/Home'
import DifficultySelect from './pages/DifficultySelect'
import Game from './pages/Game'
import Result from './pages/Result'

function App() {
  return (
    <div className="app">
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/difficulty" element={<DifficultySelect />} />
        <Route path="/game" element={<Game />} />
        <Route path="/result" element={<Result />} />
      </Routes>
    </div>
  )
}

export default App
