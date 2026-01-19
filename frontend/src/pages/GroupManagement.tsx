import { useEffect, useState } from 'react';
import { api } from '../services/api';

export default function GroupManagement() {
  const user = JSON.parse(localStorage.getItem('user') || '{}');
  const [groups, setGroups] = useState<any[]>([]);
  const [users, setUsers] = useState<any[]>([]);
  const [selectedGroup, setSelectedGroup] = useState<any>(null);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [newGroupName, setNewGroupName] = useState('');
  const [newGroupDesc, setNewGroupDesc] = useState('');

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const [groupsRes, usersRes] = await Promise.all([
        api.get('/groups'),
        api.get('/admin/users/nachwuchskraefte')
      ]);
      setGroups(groupsRes.data);
      setUsers(usersRes.data);
    } catch (error) {
      console.error('Fehler beim Laden:', error);
    }
  };

  const createGroup = async () => {
    if (!newGroupName) {
      alert('Bitte einen Namen eingeben');
      return;
    }
    
    try {
      await api.post('/groups', {
        name: newGroupName,
        description: newGroupDesc,
        created_by_user_id: user.id
      });
      
      setNewGroupName('');
      setNewGroupDesc('');
      setShowCreateForm(false);
      loadData();
    } catch (error) {
      console.error('Fehler beim Erstellen:', error);
      alert('Fehler beim Erstellen der Gruppe');
    }
  };

  const loadGroupDetails = async (groupId: number) => {
    try {
      const res = await api.get(`/groups/${groupId}`);
      setSelectedGroup(res.data);
    } catch (error) {
      console.error('Fehler beim Laden der Gruppe:', error);
    }
  };

  const addMember = async (userId: number) => {
    if (!selectedGroup) return;
    
    try {
      await api.post(`/groups/${selectedGroup.id}/members`, { user_id: userId });
      loadGroupDetails(selectedGroup.id);
    } catch (error: any) {
      alert(error.response?.data?.error || 'Fehler beim Hinzufügen');
    }
  };

  const removeMember = async (userId: number) => {
    if (!selectedGroup) return;
    
    try {
      await api.delete(`/groups/${selectedGroup.id}/members/${userId}`);
      loadGroupDetails(selectedGroup.id);
    } catch (error) {
      alert('Fehler beim Entfernen');
    }
  };

  return (
    <div className="max-w-7xl mx-auto p-8">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-bold text-gray-900">Gruppen verwalten</h1>
        <button
          onClick={() => setShowCreateForm(true)}
          className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-6 rounded-lg"
        >
          + Neue Gruppe
        </button>
      </div>
      
      {showCreateForm && (
        <div className="bg-white shadow-md rounded-lg p-6 mb-6">
          <h2 className="text-xl font-bold mb-4">Neue Gruppe erstellen</h2>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Name *</label>
              <input
                type="text"
                value={newGroupName}
                onChange={(e) => setNewGroupName(e.target.value)}
                className="w-full border border-gray-300 rounded-lg px-4 py-2"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Beschreibung</label>
              <textarea
                value={newGroupDesc}
                onChange={(e) => setNewGroupDesc(e.target.value)}
                rows={3}
                className="w-full border border-gray-300 rounded-lg px-4 py-2"
              />
            </div>
            <div className="flex space-x-4">
              <button
                onClick={createGroup}
                className="bg-green-600 hover:bg-green-700 text-white font-bold py-2 px-6 rounded-lg"
              >
                Erstellen
              </button>
              <button
                onClick={() => setShowCreateForm(false)}
                className="border border-gray-300 hover:bg-gray-50 py-2 px-6 rounded-lg"
              >
                Abbrechen
              </button>
            </div>
          </div>
        </div>
      )}
      
      <div className="grid grid-cols-2 gap-6">
        <div>
          <h2 className="text-xl font-bold text-gray-900 mb-4">Alle Gruppen</h2>
          <div className="bg-white shadow-md rounded-lg divide-y">
            {groups.map((group) => (
              <div
                key={group.id}
                className="p-4 hover:bg-gray-50 cursor-pointer"
                onClick={() => loadGroupDetails(group.id)}
              >
                <h3 className="font-semibold text-gray-900">{group.name}</h3>
                <p className="text-sm text-gray-600">{group.member_count || 0} Mitglieder</p>
              </div>
            ))}
          </div>
        </div>
        
        <div>
          {selectedGroup ? (
            <div>
              <h2 className="text-xl font-bold text-gray-900 mb-4">{selectedGroup.name}</h2>
              
              <div className="bg-white shadow-md rounded-lg p-4 mb-4">
                <h3 className="font-semibold mb-2">Mitglieder</h3>
                {selectedGroup.members?.map((member: any) => (
                  <div key={member.id} className="flex justify-between items-center py-2">
                    <div>
                      <p className="font-medium">{member.username}</p>
                      {member.character_name && (
                        <p className="text-sm text-gray-600">{member.character_name} (Lv. {member.level})</p>
                      )}
                    </div>
                    <button
                      onClick={() => removeMember(member.id)}
                      className="text-red-600 hover:text-red-900 text-sm"
                    >
                      Entfernen
                    </button>
                  </div>
                ))}
              </div>
              
              <div className="bg-white shadow-md rounded-lg p-4">
                <h3 className="font-semibold mb-2">Mitglied hinzufügen</h3>
                <div className="max-h-64 overflow-y-auto">
                  {users
                    .filter(u => !selectedGroup.members?.some((m: any) => m.id === u.id))
                    .map((u) => (
                      <button
                        key={u.id}
                        onClick={() => addMember(u.id)}
                        className="block w-full text-left px-4 py-2 hover:bg-gray-100 rounded"
                      >
                        {u.username}
                      </button>
                    ))}
                </div>
              </div>
            </div>
          ) : (
            <div className="text-center text-gray-500 mt-12">
              Wähle eine Gruppe aus
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
