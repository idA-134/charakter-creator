import { useEffect, useState } from 'react';
import { api } from '../services/api';

export default function ManageQuests() {
  const user = JSON.parse(localStorage.getItem('user') || '{}');
  const [quests, setQuests] = useState<any[]>([]);
  const [selectedQuest, setSelectedQuest] = useState<number | null>(null);
  const [groups, setGroups] = useState<any[]>([]);
  const [users, setUsers] = useState<any[]>([]);
  const [editingQuest, setEditingQuest] = useState<any | null>(null);
  const [equipment, setEquipment] = useState<any[]>([]);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const isAdmin = user.is_admin || user.is_super_admin || user.isAdmin || user.isSuperAdmin;
      const [questsRes, groupsRes, usersRes, equipmentRes] = await Promise.all([
        api.get(`/dozent/quests/all?userId=${user.id}&isAdmin=${isAdmin}`),
        api.get('/groups'),
        api.get('/admin/users/nachwuchskraefte'),
        api.get('/equipment')
      ]);
      setQuests(questsRes.data);
      setGroups(groupsRes.data);
      setUsers(usersRes.data);
      setEquipment(equipmentRes.data);
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

  const deleteQuest = async (questId: number) => {
    if (!confirm('Quest wirklich löschen? Diese Aktion kann nicht rückgängig gemacht werden.')) {
      return;
    }
    try {
      await api.delete(`/dozent/quests/${questId}`);
      alert('Quest erfolgreich gelöscht!');
      loadData();
    } catch (error) {
      console.error('Fehler beim Löschen:', error);
      alert('Fehler beim Löschen der Quest');
    }
  };

  const updateQuest = async () => {
    if (!editingQuest) return;
    try {
      await api.put(`/dozent/quests/${editingQuest.id}`, {
        ...editingQuest,
        equipment_reward_id: editingQuest.equipment_reward_id || null,
        required_equipment_id: editingQuest.required_equipment_id || null
      });
      alert('Quest erfolgreich aktualisiert!');
      setEditingQuest(null);
      loadData();
    } catch (error) {
      console.error('Fehler beim Aktualisieren:', error);
      alert('Fehler beim Aktualisieren der Quest');
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
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Erstellt von</th>
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
                <td className="px-6 py-4 text-sm text-gray-500">{quest.created_by_username || 'Unbekannt'}</td>
                <td className="px-6 py-4 text-sm text-gray-500 capitalize">{quest.difficulty}</td>
                <td className="px-6 py-4 text-sm text-gray-500">{quest.assignment_count || 0}</td>
                <td className="px-6 py-4 text-sm text-gray-500">{quest.submission_count || 0}</td>
                <td className="px-6 py-4 text-sm font-medium space-x-2">
                  <button
                    onClick={() => setSelectedQuest(quest.id)}
                    className="text-blue-600 hover:text-blue-900"
                  >
                    Zuweisen
                  </button>
                  <button
                    onClick={() => setEditingQuest(quest)}
                    className="text-green-600 hover:text-green-900"
                  >
                    Bearbeiten
                  </button>
                  <button
                    onClick={() => deleteQuest(quest.id)}
                    className="text-red-600 hover:text-red-900"
                  >
                    Löschen
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

      {editingQuest && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50 overflow-y-auto">
          <div className="bg-white rounded-lg p-6 max-w-4xl w-full my-8 max-h-[90vh] overflow-y-auto">
            <h3 className="text-2xl font-bold mb-4">Quest bearbeiten</h3>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-1">Titel</label>
                <input
                  type="text"
                  value={editingQuest.title}
                  onChange={(e) => setEditingQuest({...editingQuest, title: e.target.value})}
                  className="w-full border rounded px-3 py-2"
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">Beschreibung</label>
                <textarea
                  value={editingQuest.description}
                  onChange={(e) => setEditingQuest({...editingQuest, description: e.target.value})}
                  rows={4}
                  className="w-full border rounded px-3 py-2"
                />
              </div>

              <div className="grid grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-1">Kategorie</label>
                  <select
                    value={editingQuest.category}
                    onChange={(e) => setEditingQuest({...editingQuest, category: e.target.value})}
                    className="w-full border rounded px-3 py-2"
                  >
                    <option>Programmierung</option>
                    <option>Netzwerke</option>
                    <option>Datenbanken</option>
                    <option>Hardware</option>
                    <option>Sicherheit</option>
                    <option>Projektmanagement</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium mb-1">Schwierigkeit</label>
                  <select
                    value={editingQuest.difficulty}
                    onChange={(e) => setEditingQuest({...editingQuest, difficulty: e.target.value})}
                    className="w-full border rounded px-3 py-2"
                  >
                    <option>easy</option>
                    <option>medium</option>
                    <option>hard</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium mb-1">Min. Level</label>
                  <input
                    type="number"
                    value={editingQuest.min_level || 1}
                    onChange={(e) => setEditingQuest({...editingQuest, min_level: parseInt(e.target.value)})}
                    className="w-full border rounded px-3 py-2"
                    min="1"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-1">🎁 Belohnungs-Equipment</label>
                  <select
                    value={editingQuest.equipment_reward_id || ''}
                    onChange={(e) => setEditingQuest({...editingQuest, equipment_reward_id: e.target.value})}
                    className="w-full border rounded px-3 py-2"
                  >
                    <option value="">Kein Equipment</option>
                    {equipment.map((eq) => (
                      <option key={eq.id} value={eq.id}>
                        {eq.name} ({eq.rarity})
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium mb-1">🔒 Benötigtes Equipment</label>
                  <select
                    value={editingQuest.required_equipment_id || ''}
                    onChange={(e) => setEditingQuest({...editingQuest, required_equipment_id: e.target.value})}
                    className="w-full border rounded px-3 py-2"
                  >
                    <option value="">Kein Equipment erforderlich</option>
                    {equipment.map((eq) => (
                      <option key={eq.id} value={eq.id}>
                        {eq.name} ({eq.rarity})
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="flex gap-2 pt-4">
                <button
                  onClick={updateQuest}
                  className="flex-1 bg-green-600 hover:bg-green-700 text-white font-bold py-2 px-4 rounded"
                >
                  Speichern
                </button>
                <button
                  onClick={() => setEditingQuest(null)}
                  className="flex-1 bg-gray-200 hover:bg-gray-300 py-2 px-4 rounded"
                >
                  Abbrechen
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
