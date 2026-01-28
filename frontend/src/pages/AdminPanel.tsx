import { useEffect, useState } from 'react';
import { api } from '../services/api';

export default function AdminPanel() {
  const [users, setUsers] = useState<any[]>([]);
  const [pendingDozenten, setPendingDozenten] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'all' | 'pending'>('all');

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      const [usersRes, pendingRes] = await Promise.all([
        api.get('/admin/users'),
        api.get('/admin/pending-dozenten')
      ]);
      setUsers(usersRes.data);
      setPendingDozenten(pendingRes.data);
    } catch (error) {
      console.error('Fehler beim Laden der Daten:', error);
    } finally {
      setLoading(false);
    }
  };

  const changeRole = async (userId: number, role: string) => {
    try {
      await api.put(`/admin/users/${userId}/role`, { role });
      loadData();
    } catch (error) {
      console.error('Fehler beim Ändern der Rolle:', error);
      alert('Fehler beim Ändern der Rolle');
    }
  };

  const toggleAdmin = async (userId: number, isAdmin: boolean) => {
    try {
      await api.put(`/admin/users/${userId}/admin`, { is_admin: !isAdmin });
      loadData();
    } catch (error: any) {
      console.error('Fehler beim Ändern des Admin-Status:', error);
      alert(error.response?.data?.error || 'Fehler beim Ändern des Admin-Status');
    }
  };

  const approveDozent = async (userId: number) => {
    try {
      await api.post(`/admin/approve-dozent/${userId}`);
      loadData();
    } catch (error: any) {
      console.error('Fehler beim Genehmigen:', error);
      alert(error.response?.data?.error || 'Fehler beim Genehmigen');
    }
  };

  const rejectDozent = async (userId: number) => {
    if (!confirm('Dozent-Anfrage wirklich ablehnen und User löschen?')) return;
    
    try {
      await api.post(`/admin/reject-dozent/${userId}`);
      loadData();
    } catch (error: any) {
      console.error('Fehler beim Ablehnen:', error);
      alert(error.response?.data?.error || 'Fehler beim Ablehnen');
    }
  };

  const deleteUser = async (userId: number) => {
    if (!confirm('User wirklich löschen?')) return;
    
    try {
      await api.delete(`/admin/users/${userId}`);
      loadData();
    } catch (error: any) {
      console.error('Fehler beim Löschen des Users:', error);
      alert(error.response?.data?.error || 'Fehler beim Löschen des Users');
    }
  };

  if (loading) {
    return <div className="p-8">Lade Daten...</div>;
  }

  return (
    <div className="max-w-7xl mx-auto p-8">
      <h1 className="text-3xl font-bold text-gray-900 mb-8">User-Verwaltung</h1>
      
      {/* Tabs */}
      <div className="mb-6 border-b border-gray-200">
        <nav className="flex space-x-8">
          <button
            onClick={() => setActiveTab('pending')}
            className={`py-4 px-1 border-b-2 font-medium text-sm ${
              activeTab === 'pending'
                ? 'border-primary-500 text-primary-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            Ausstehende Dozenten
            {pendingDozenten.length > 0 && (
              <span className="ml-2 px-2 py-1 text-xs font-bold rounded-full bg-red-100 text-red-600">
                {pendingDozenten.length}
              </span>
            )}
          </button>
          <button
            onClick={() => setActiveTab('all')}
            className={`py-4 px-1 border-b-2 font-medium text-sm ${
              activeTab === 'all'
                ? 'border-primary-500 text-primary-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            Alle User
          </button>
        </nav>
      </div>

      {/* Ausstehende Dozenten Tab */}
      {activeTab === 'pending' && (
        <div>
          {pendingDozenten.length === 0 ? (
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 text-blue-800">
              Keine ausstehenden Dozent-Genehmigungen
            </div>
          ) : (
            <div className="bg-white shadow-md rounded-lg overflow-hidden">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Username
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Rolle
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Registriert am
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Aktionen
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {pendingDozenten.map((user) => (
                    <tr key={user.id}>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                        {user.username}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        <span className="px-3 py-1 inline-flex text-xs leading-5 font-semibold rounded-full bg-yellow-100 text-yellow-800">
                          {user.role === 'dozent' ? 'Dozent (ausstehend)' : user.role}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {new Date(user.created_at).toLocaleDateString('de-DE')}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium space-x-2">
                        <button
                          onClick={() => approveDozent(user.id)}
                          className="inline-flex items-center px-3 py-2 rounded-md text-sm font-medium text-white bg-green-600 hover:bg-green-700"
                        >
                          Genehmigen
                        </button>
                        <button
                          onClick={() => rejectDozent(user.id)}
                          className="inline-flex items-center px-3 py-2 rounded-md text-sm font-medium text-white bg-red-600 hover:bg-red-700"
                        >
                          Ablehnen
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* Alle User Tab */}
      {activeTab === 'all' && (
        <div>
          <div className="bg-white shadow-md rounded-lg overflow-hidden">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    ID
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Username
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Rolle
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Admin
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Erstellt
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Aktionen
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {users.map((user) => (
                  <tr key={user.id}>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {user.id}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                      {user.username}
                      {user.is_super_admin === 1 && (
                        <span className="ml-2 px-2 py-1 text-xs font-semibold rounded-full bg-purple-100 text-purple-800">
                          Super-Admin
                        </span>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      <select
                        value={user.role || 'nachwuchskraft'}
                        onChange={(e) => changeRole(user.id, e.target.value)}
                        disabled={user.is_super_admin === 1}
                        className="border rounded px-2 py-1 text-sm disabled:opacity-50"
                      >
                        <option value="nachwuchskraft">Nachwuchskraft</option>
                        <option value="dozent">Dozent</option>
                        <option value="admin">Admin</option>
                      </select>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {user.is_super_admin === 1 ? (
                        <span className="text-purple-600 font-semibold">Super-Admin</span>
                      ) : (
                        <button
                          onClick={() => toggleAdmin(user.id, user.is_admin === 1)}
                          className={`px-3 py-1 rounded text-xs font-medium ${
                            user.is_admin === 1
                              ? 'bg-green-100 text-green-800'
                              : 'bg-gray-100 text-gray-800'
                          }`}
                        >
                          {user.is_admin === 1 ? 'Ja' : 'Nein'}
                        </button>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {new Date(user.created_at).toLocaleDateString('de-DE')}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                      {user.is_super_admin !== 1 && (
                        <button
                          onClick={() => deleteUser(user.id)}
                          className="text-red-600 hover:text-red-900"
                        >
                          Löschen
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
      
      {/* Statistiken */}
      <div className="mt-8 grid grid-cols-3 gap-6">
        <div className="bg-white p-6 rounded-lg shadow-md">
          <h3 className="text-lg font-semibold text-gray-900 mb-2">Gesamt</h3>
          <p className="text-3xl font-bold text-blue-600">{users.length}</p>
        </div>
        <div className="bg-white p-6 rounded-lg shadow-md">
          <h3 className="text-lg font-semibold text-gray-900 mb-2">Nachwuchskräfte</h3>
          <p className="text-3xl font-bold text-green-600">
            {users.filter(u => u.role === 'nachwuchskraft').length}
          </p>
        </div>
        <div className="bg-white p-6 rounded-lg shadow-md">
          <h3 className="text-lg font-semibold text-gray-900 mb-2">Dozenten</h3>
          <p className="text-3xl font-bold text-purple-600">
            {users.filter(u => u.role === 'dozent' || u.is_admin === 1).length}
          </p>
        </div>
      </div>
    </div>
  );
}
