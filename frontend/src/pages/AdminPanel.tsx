import { useEffect, useState } from 'react';
import { api } from '../services/api';

export default function AdminPanel() {
  const [users, setUsers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadUsers();
  }, []);

  const loadUsers = async () => {
    try {
      const response = await api.get('/admin/users');
      setUsers(response.data);
    } catch (error) {
      console.error('Fehler beim Laden der User:', error);
    } finally {
      setLoading(false);
    }
  };

  const changeRole = async (userId: number, role: string) => {
    try {
      await api.put(`/admin/users/${userId}/role`, { role });
      loadUsers();
    } catch (error) {
      console.error('Fehler beim Ändern der Rolle:', error);
      alert('Fehler beim Ändern der Rolle');
    }
  };

  const toggleAdmin = async (userId: number, isAdmin: boolean) => {
    try {
      await api.put(`/admin/users/${userId}/admin`, { is_admin: !isAdmin });
      loadUsers();
    } catch (error: any) {
      console.error('Fehler beim Ändern des Admin-Status:', error);
      alert(error.response?.data?.error || 'Fehler beim Ändern des Admin-Status');
    }
  };

  const deleteUser = async (userId: number) => {
    if (!confirm('User wirklich löschen?')) return;
    
    try {
      await api.delete(`/admin/users/${userId}`);
      loadUsers();
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
