import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { useState, useEffect } from 'react';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import CharacterCreation from './pages/CharacterCreation';
import CharacterDetail from './pages/CharacterDetail';
import Quests from './pages/Quests';
import Achievements from './pages/Achievements';
import Leaderboard from './pages/Leaderboard';
import AdminPanel from './pages/AdminPanel';
import DozentDashboard from './pages/DozentDashboard';
import CreateQuest from './pages/CreateQuest';
import ManageQuests from './pages/ManageQuests';
import SubmissionReview from './pages/SubmissionReview';
import GroupManagement from './pages/GroupManagement';
import Inventory from './pages/Inventory';
import EquipmentManagement from './pages/EquipmentManagement';
import Navigation from './components/Navigation';

function App() {
  const [user, setUser] = useState<any>(null);

  useEffect(() => {
    // User aus localStorage laden beim Start
    const storedUser = localStorage.getItem('user');
    if (storedUser) {
      setUser(JSON.parse(storedUser));
    }
  }, []);

  const handleSetUser = (userData: any) => {
    setUser(userData);
    if (userData) {
      localStorage.setItem('user', JSON.stringify(userData));
    }
  };

  return (
    <Router>
      <div className="min-h-screen bg-gray-100">
        {user && <Navigation setUser={setUser} />}
        <Routes>
          <Route 
            path="/login" 
            element={user ? <Navigate to="/dashboard" /> : <Login setUser={handleSetUser} />} 
          />
          <Route 
            path="/dashboard" 
            element={user ? <Dashboard user={user} /> : <Navigate to="/login" />} 
          />
          <Route 
            path="/character/create" 
            element={user ? <CharacterCreation user={user} /> : <Navigate to="/login" />} 
          />
          <Route 
            path="/character/:id" 
            element={user ? <CharacterDetail /> : <Navigate to="/login" />} 
          />
          <Route 
            path="/quests/:characterId" 
            element={user ? <Quests /> : <Navigate to="/login" />} 
          />
          <Route 
            path="/inventory/:characterId" 
            element={user ? <Inventory /> : <Navigate to="/login" />} 
          />
          <Route 
            path="/achievements/:characterId" 
            element={user ? <Achievements /> : <Navigate to="/login" />} 
          />
          <Route 
            path="/leaderboard" 
            element={user ? <Leaderboard /> : <Navigate to="/login" />} 
          />
          <Route 
            path="/admin" 
            element={user?.isAdmin || user?.isSuperAdmin ? <AdminPanel /> : <Navigate to="/dashboard" />} 
          />
          <Route 
            path="/dozent" 
            element={user?.role === 'dozent' || user?.isAdmin ? <DozentDashboard /> : <Navigate to="/dashboard" />} 
          />
          <Route 
            path="/dozent/quests/create" 
            element={user?.role === 'dozent' || user?.isAdmin ? <CreateQuest /> : <Navigate to="/dashboard" />} 
          />
          <Route 
            path="/dozent/quests" 
            element={user?.role === 'dozent' || user?.isAdmin ? <ManageQuests /> : <Navigate to="/dashboard" />} 
          />
          <Route 
            path="/dozent/submissions" 
            element={user?.role === 'dozent' || user?.isAdmin ? <SubmissionReview /> : <Navigate to="/dashboard" />} 
          />
          <Route 
            path="/dozent/groups" 
            element={user?.role === 'dozent' || user?.isAdmin ? <GroupManagement /> : <Navigate to="/dashboard" />} 
          />
          <Route 
            path="/dozent/equipment" 
            element={user?.role === 'dozent' || user?.isAdmin ? <EquipmentManagement /> : <Navigate to="/dashboard" />} 
          />
          <Route path="/" element={<Navigate to={user ? "/dashboard" : "/login"} />} />
        </Routes>
      </div>
    </Router>
  );
}

export default App;
