
import './App.css';
import Website from './components/Website';
import { BrowserRouter as Router } from 'react-router-dom';
import Dashboard from './components/Dashboard'


function App() {
  return (
    <div className="App">
      
      <Router>
      <Dashboard />
    </Router>
    </div>
  );
}

export default App;
