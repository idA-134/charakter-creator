import { useEffect, useState } from 'react';
import { api } from '../services/api';

export default function ManageQuests() {
  const user = JSON.parse(localStorage.getItem('user') || '{}');
  const [quests, setQuests] = useState<any[]>([]);
  const [selectedQuest, setSelectedQuest] = useState<number | null>(null);
  const [groups, setGroups] = useState<any[]>([]);
  const [users, setUsers] = useState<any[]>([]);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const [questsRes, groupsRes, usersRes] = await Promise.all([
        api.get(`/dozent/quests/my/${user.id}`),
        api.get('/groups'),
        api.get('/admin/users/nachwuchskraefte')
      ]);
      setQuests(questsRes.data);
      setGroups(groupsRes.data);
      setUsers(usersRes.data);
    } catch (error) {
      console.error('Fehler beim Laden:', error);
    }
  };

  const assignQuest = async (questId: number, targetType: 'user' | 'group', targetId: number) => {
    try {
      await api.post(`/dozent/quests/${questId}/assign`, {
        [targetType === 'user' ? 'user_id' : 'group_id']: targetId
      });
      alert('Quest erfolgreich zugewiesen!');
      setSelectedQuest(null);
    } catch (error) {
      console.error('Fehler beim Zuweisen:', error);
      alert('Fehler beim Zuweisen der Quest');
    }
  };

  return (
    <div className="max-w-7xl mx-auto p-8">
      <h1 className="text-3xl font-bold text-gray-900 mb-8">Quests verwalten</h1>
      
      <div className="bg-white shadow-md rounded-lg overflow-hidden">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Titel</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Schwierigkeit</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Zuweisungen</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Abgaben</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Aktionen</th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {quests.map((quest) => (
              <tr key={quest.id}>
                <td className="px-6 py-4 text-sm font-medium text-gray-900">{quest.title}</td>
                <td className="px-6 py-4 text-sm text-gray-500 capitalize">{quest.difficulty}</td>
                <td className="px-6 py-4 text-sm text-gray-500">{quest.assignment_count || 0}</td>
                <td className="px-6 py-4 text-sm text-gray-500">{quest.submission_count || 0}</td>
                <td className="px-6 py-4 text-sm font-medium">
                  <button
                    onClick={() => setSelectedQuest(quest.id)}
                    className="text-blue-600 hover:text-blue-900 mr-4"
                  >
                    Zuweisen
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {selectedQuest && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-lg p-6 max-w-md w-full">
            <h3 className="text-lg font-bold mb-4">Quest zuweisen</h3>
            
            <div className="space-y-4">
              <div>
                <h4 className="font-semibold mb-2">An Gruppe</h4>
                {groups.map((group) => (
                  <button
                    key={group.id}
                    onClick={() => assignQuest(selectedQuest, 'group', group.id)}
                    className="block w-full text-left px-4 py-2 hover:bg-gray-100 rounded"
                  >
                    {group.name} ({group.member_count} Mitglieder)
                  </button>
                ))}
              </div>
              
              <div>
                <h4 className="font-semibold mb-2">An Einzelperson</h4>
                <div className="max-h-48 overflow-y-auto">
                  {users.map((u) => (
                    <button
                      key={u.id}
                      onClick={() => assignQuest(selectedQuest, 'user', u.id)}
                      className="block w-full text-left px-4 py-2 hover:bg-gray-100 rounded"
                    >
                      {u.username}
                    </button>
                  ))}
                </div>
              </div>
            </div>
            
            <button
              onClick={() => setSelectedQuest(null)}
              className="mt-4 w-full bg-gray-200 hover:bg-gray-300 py-2 rounded"
            >
              Schließen
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
