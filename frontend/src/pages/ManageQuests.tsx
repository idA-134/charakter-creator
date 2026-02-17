import { useEffect, useState } from 'react';
import { api } from '../services/api';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000';

export default function ManageQuests() {
  const user = JSON.parse(localStorage.getItem('user') || '{}');
  const [quests, setQuests] = useState<any[]>([]);
  const [selectedQuest, setSelectedQuest] = useState<number | null>(null);
  const [selectedQuestDetails, setSelectedQuestDetails] = useState<any | null>(null);
  const [groups, setGroups] = useState<any[]>([]);
  const [users, setUsers] = useState<any[]>([]);
  const [editingQuest, setEditingQuest] = useState<any | null>(null);
  const [equipment, setEquipment] = useState<any[]>([]);
  const [questResources, setQuestResources] = useState<any[]>([]);
  const [resourceFiles, setResourceFiles] = useState<File[]>([]);
  const [resourcesLoading, setResourcesLoading] = useState(false);

  const getApprovalLabel = (status: string | null | undefined) => {
    if (status === 'approved') return 'Freigegeben';
    if (status === 'rejected') return 'Abgelehnt';
    return 'Ausstehend';
  };

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

  const loadResources = async (questId: number) => {
    try {
      setResourcesLoading(true);
      const res = await api.get(`/quests/${questId}/resources`);
      setQuestResources(res.data || []);
    } catch (error) {
      console.error('Fehler beim Laden der Ressourcen:', error);
      setQuestResources([]);
    } finally {
      setResourcesLoading(false);
    }
  };

  useEffect(() => {
    if (editingQuest?.id) {
      loadResources(editingQuest.id);
    } else {
      setQuestResources([]);
    }
  }, [editingQuest]);

  const uploadResources = async () => {
    if (!editingQuest || resourceFiles.length === 0) {
      return;
    }

    try {
      const filesData = new FormData();
      resourceFiles.forEach((file) => filesData.append('files', file));
      filesData.append('uploaded_by_user_id', String(user.id));

      await api.post(`/dozent/quests/${editingQuest.id}/resources`, filesData);

      setResourceFiles([]);
      await loadResources(editingQuest.id);
      alert('Ressourcen erfolgreich hochgeladen!');
    } catch (error: any) {
      console.error('Fehler beim Hochladen der Ressourcen:', error);
      const errorMsg = error.response?.data?.error || 'Fehler beim Hochladen der Ressourcen';
      alert(errorMsg);
    }
  };

  const deleteResource = async (resourceId: number) => {
    if (!confirm('Ressource wirklich löschen?')) {
      return;
    }

    try {
      await api.delete(`/dozent/quests/resources/${resourceId}`);
      if (editingQuest) {
        await loadResources(editingQuest.id);
      }
    } catch (error) {
      console.error('Fehler beim Löschen der Ressource:', error);
      alert('Fehler beim Löschen der Ressource');
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
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Freigabe</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Zuweisungen</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Abgaben</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Aktionen</th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {quests.map((quest) => (
              <tr key={quest.id}>
                <td className="px-6 py-4 text-sm font-medium text-gray-900">
                  <button
                    onClick={() => setSelectedQuestDetails(quest)}
                    className="text-blue-600 hover:text-blue-900"
                  >
                    {quest.title}
                  </button>
                </td>
                <td className="px-6 py-4 text-sm text-gray-500">{quest.created_by_username || 'Unbekannt'}</td>
                <td className="px-6 py-4 text-sm text-gray-500 capitalize">{quest.difficulty}</td>
                <td className="px-6 py-4 text-sm text-gray-500">{getApprovalLabel(quest.approval_status)}</td>
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

            {(() => {
              const selectedQuestData = quests.find((q) => q.id === selectedQuest);
              const isApproved = selectedQuestData?.approval_status === 'approved';
              const adminGroup = groups.find((g) => g.name === 'Admins');

              return (
                <>
                  {!isApproved && (
                    <div className="mb-4 p-3 bg-yellow-50 text-yellow-800 rounded-lg text-sm">
                      Quest muss erst von Admins freigegeben werden. Bitte an Gruppe "Admins" senden.
                    </div>
                  )}

                  <div className="space-y-4">
                    <div>
                      <h4 className="font-semibold mb-2">An Gruppe</h4>
                      {groups.map((group) => {
                        const isAdminsGroup = group.name === 'Admins';
                        const isDisabled = !isApproved && !isAdminsGroup;
                        return (
                          <button
                            key={group.id}
                            onClick={() => assignQuest(selectedQuest, 'group', group.id)}
                            disabled={isDisabled}
                            className={`block w-full text-left px-4 py-2 rounded ${isDisabled ? 'opacity-50 cursor-not-allowed' : 'hover:bg-gray-100'}`}
                          >
                            {group.name} ({group.member_count} Mitglieder)
                          </button>
                        );
                      })}
                      {!adminGroup && (
                        <p className="text-xs text-red-600 mt-2">Admins-Gruppe nicht gefunden.</p>
                      )}
                    </div>

                    <div>
                      <h4 className="font-semibold mb-2">An Einzelperson</h4>
                      <div className="max-h-48 overflow-y-auto">
                        {users.map((u) => (
                          <button
                            key={u.id}
                            onClick={() => assignQuest(selectedQuest, 'user', u.id)}
                            disabled={!isApproved}
                            className={`block w-full text-left px-4 py-2 rounded ${!isApproved ? 'opacity-50 cursor-not-allowed' : 'hover:bg-gray-100'}`}
                          >
                            {u.username}
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>
                </>
              );
            })()}
            
            <button
              onClick={() => setSelectedQuest(null)}
              className="mt-4 w-full bg-gray-200 hover:bg-gray-300 py-2 rounded"
            >
              Schließen
            </button>
          </div>
        </div>
      )}

      {selectedQuestDetails && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg shadow-lg max-w-3xl w-full p-6 max-h-[90vh] overflow-y-auto">
            <div className="flex items-start justify-between mb-4">
              <h2 className="text-2xl font-bold text-gray-900">{selectedQuestDetails.title}</h2>
              <button
                onClick={() => setSelectedQuestDetails(null)}
                className="text-gray-500 hover:text-gray-700"
              >
                Schliessen
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <h3 className="text-sm font-semibold text-gray-700">Beschreibung</h3>
                <p className="text-gray-900 mt-1 whitespace-pre-wrap">{selectedQuestDetails.description}</p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <h4 className="text-sm font-semibold text-gray-700">Kategorie</h4>
                  <p className="text-gray-900">{selectedQuestDetails.category || '-'}</p>
                </div>
                <div>
                  <h4 className="text-sm font-semibold text-gray-700">Schwierigkeit</h4>
                  <p className="text-gray-900 capitalize">{selectedQuestDetails.difficulty}</p>
                </div>
                <div>
                  <h4 className="text-sm font-semibold text-gray-700">Min. Level</h4>
                  <p className="text-gray-900">{selectedQuestDetails.min_level}</p>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <h4 className="text-sm font-semibold text-gray-700">XP</h4>
                  <p className="text-gray-900">{selectedQuestDetails.xp_reward}</p>
                </div>
                <div>
                  <h4 className="text-sm font-semibold text-gray-700">Erstellt von</h4>
                  <p className="text-gray-900">{selectedQuestDetails.created_by_username || 'Unbekannt'}</p>
                </div>
              </div>

              <div>
                <h4 className="text-sm font-semibold text-gray-700">Attribut-Belohnungen</h4>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-2 mt-2 text-gray-900 text-sm">
                  <div>Programmierung: {selectedQuestDetails.programmierung_reward || 0}</div>
                  <div>Netzwerke: {selectedQuestDetails.netzwerke_reward || 0}</div>
                  <div>Datenbanken: {selectedQuestDetails.datenbanken_reward || 0}</div>
                  <div>Hardware: {selectedQuestDetails.hardware_reward || 0}</div>
                  <div>Sicherheit: {selectedQuestDetails.sicherheit_reward || 0}</div>
                  <div>Projektmanagement: {selectedQuestDetails.projektmanagement_reward || 0}</div>
                </div>
              </div>
            </div>

            <div className="mt-6 flex flex-col sm:flex-row gap-3">
              <button
                onClick={() => setSelectedQuestDetails(null)}
                className="flex-1 inline-flex items-center justify-center px-4 py-2 rounded-md text-sm font-medium text-gray-700 bg-gray-200 hover:bg-gray-300"
              >
                Schliessen
              </button>
            </div>
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

              <div className="border rounded-lg p-4 bg-gray-50">
                <h4 className="text-sm font-semibold text-gray-800 mb-2">📎 Ressourcen</h4>
                <div className="flex flex-col gap-3">
                  <input
                    type="file"
                    multiple
                    onChange={(e) => setResourceFiles(e.target.files ? Array.from(e.target.files) : [])}
                    className="w-full border border-gray-300 rounded px-3 py-2 bg-white"
                  />
                  <button
                    onClick={uploadResources}
                    disabled={resourceFiles.length === 0}
                    className="self-start px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded disabled:opacity-50"
                  >
                    Ressourcen hochladen
                  </button>
                </div>

                <div className="mt-4">
                  {resourcesLoading ? (
                    <p className="text-sm text-gray-500">Lade Ressourcen...</p>
                  ) : questResources.length === 0 ? (
                    <p className="text-sm text-gray-500">Keine Ressourcen vorhanden</p>
                  ) : (
                    <ul className="space-y-2">
                      {questResources.map((res) => (
                        <li key={res.id} className="flex items-center justify-between gap-3">
                          <a
                            href={`${API_BASE_URL}/${res.file_url}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-blue-600 hover:underline text-sm"
                          >
                            {res.original_name}
                          </a>
                          <button
                            onClick={() => deleteResource(res.id)}
                            className="text-red-600 hover:text-red-800 text-sm"
                          >
                            Löschen
                          </button>
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
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
