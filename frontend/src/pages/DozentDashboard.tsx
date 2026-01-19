import { Link } from 'react-router-dom';
import { useEffect, useState } from 'react';
import { api } from '../services/api';

export default function DozentDashboard() {
  const user = JSON.parse(localStorage.getItem('user') || '{}');
  const [stats, setStats] = useState<any>({ quests: 0, submissions: 0, groups: 0 });

  useEffect(() => {
    loadStats();
  }, []);

  const loadStats = async () => {
    try {
      const [questsRes, groupsRes] = await Promise.all([
        api.get(`/dozent/quests/my/${user.id}`),
        api.get('/groups')
      ]);
      
      const totalSubmissions = questsRes.data.reduce((sum: number, q: any) => 
        sum + (q.submission_count || 0), 0
      );
      
      setStats({
        quests: questsRes.data.length,
        submissions: totalSubmissions,
        groups: groupsRes.data.length
      });
    } catch (error) {
      console.error('Fehler beim Laden der Statistiken:', error);
    }
  };

  return (
    <div className="max-w-7xl mx-auto p-8">
      <h1 className="text-3xl font-bold text-gray-900 mb-8">Dozenten-Dashboard</h1>
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <div className="bg-white p-6 rounded-lg shadow-md">
          <h3 className="text-lg font-semibold text-gray-900 mb-2">Meine Quests</h3>
          <p className="text-3xl font-bold text-blue-600">{stats.quests}</p>
        </div>
        <div className="bg-white p-6 rounded-lg shadow-md">
          <h3 className="text-lg font-semibold text-gray-900 mb-2">Offene Abgaben</h3>
          <p className="text-3xl font-bold text-orange-600">{stats.submissions}</p>
        </div>
        <div className="bg-white p-6 rounded-lg shadow-md">
          <h3 className="text-lg font-semibold text-gray-900 mb-2">Gruppen</h3>
          <p className="text-3xl font-bold text-green-600">{stats.groups}</p>
        </div>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Link
          to="/dozent/quests/create"
          className="bg-blue-600 hover:bg-blue-700 text-white p-6 rounded-lg shadow-md text-center transition-colors"
        >
          <h3 className="text-xl font-bold mb-2">Quest erstellen</h3>
          <p className="text-blue-100">Neue Aufgabe für Nachwuchskräfte anlegen</p>
        </Link>
        
        <Link
          to="/dozent/quests"
          className="bg-purple-600 hover:bg-purple-700 text-white p-6 rounded-lg shadow-md text-center transition-colors"
        >
          <h3 className="text-xl font-bold mb-2">Quests verwalten</h3>
          <p className="text-purple-100">Alle Quests anzeigen und bearbeiten</p>
        </Link>
        
        <Link
          to="/dozent/submissions"
          className="bg-orange-600 hover:bg-orange-700 text-white p-6 rounded-lg shadow-md text-center transition-colors"
        >
          <h3 className="text-xl font-bold mb-2">Abgaben bewerten</h3>
          <p className="text-orange-100">Eingereichte Lösungen prüfen und benoten</p>
        </Link>
        
        <Link
          to="/dozent/groups"
          className="bg-green-600 hover:bg-green-700 text-white p-6 rounded-lg shadow-md text-center transition-colors"
        >
          <h3 className="text-xl font-bold mb-2">Gruppen verwalten</h3>
          <p className="text-green-100">Nachwuchskräfte in Gruppen organisieren</p>
        </Link>
        
        <Link
          to="/dozent/equipment"
          className="bg-indigo-600 hover:bg-indigo-700 text-white p-6 rounded-lg shadow-md text-center transition-colors"
        >
          <h3 className="text-xl font-bold mb-2">🎒 Equipment verwalten</h3>
          <p className="text-indigo-100">Gegenstände erstellen und verwalten</p>
        </Link>
      </div>
    </div>
  );
}
