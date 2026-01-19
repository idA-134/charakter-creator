import { Link, useNavigate } from 'react-router-dom';
import NotificationBell from './NotificationBell';

interface NavigationProps {
  setUser: (user: any) => void;
}

export default function Navigation({ setUser }: NavigationProps) {
  const navigate = useNavigate();
  const user = JSON.parse(localStorage.getItem('user') || '{}');

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    setUser(null);
    navigate('/login');
  };

  return (
    <nav className="bg-white shadow-lg">
      <div className="max-w-7xl mx-auto px-4">
        <div className="flex justify-between h-16">
          <div className="flex space-x-8">
            <Link 
              to="/dashboard" 
              className="inline-flex items-center px-1 pt-1 text-gray-900 hover:text-primary-600"
            >
              Dashboard
            </Link>
            <Link 
              to="/leaderboard" 
              className="inline-flex items-center px-1 pt-1 text-gray-900 hover:text-primary-600"
            >
              Rangliste
            </Link>
            {(user.role === 'dozent' || user.isAdmin) && (
              <Link 
                to="/dozent" 
                className="inline-flex items-center px-1 pt-1 text-purple-600 hover:text-purple-800 font-semibold"
              >
                Dozenten-Panel
              </Link>
            )}
            {(user.isAdmin || user.isSuperAdmin) && (
              <Link 
                to="/admin" 
                className="inline-flex items-center px-1 pt-1 text-red-600 hover:text-red-800 font-semibold"
              >
                Admin-Panel
              </Link>
            )}
          </div>
          <div className="flex items-center space-x-4">
            <NotificationBell />
            <button
              onClick={handleLogout}
              className="px-4 py-2 text-sm font-medium text-white bg-red-600 hover:bg-red-700 rounded-lg transition-colors"
            >
              Abmelden
            </button>
          </div>
        </div>
      </div>
    </nav>
  );
}
