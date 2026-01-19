import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';

interface Equipment {
  id: number;
  name: string;
  description: string;
  rarity: 'common' | 'uncommon' | 'rare' | 'epic' | 'legendary';
  created_at: string;
}

export default function EquipmentManagement() {
  const navigate = useNavigate();
  const [equipment, setEquipment] = useState<Equipment[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    rarity: 'common' as Equipment['rarity']
  });

  useEffect(() => {
    loadEquipment();
  }, []);

  const loadEquipment = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get('http://localhost:3000/api/equipment', {
        headers: { Authorization: `Bearer ${token}` }
      });
      setEquipment(response.data);
    } catch (error) {
      console.error('Fehler beim Laden der Equipment:', error);
      alert('Fehler beim Laden der Equipment');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.name.trim() || !formData.description.trim()) {
      alert('Bitte alle Felder ausfüllen');
      return;
    }

    try {
      const token = localStorage.getItem('token');
      await axios.post('http://localhost:3000/api/equipment', formData, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      alert('Equipment erfolgreich erstellt!');
      setFormData({ name: '', description: '', rarity: 'common' });
      setShowForm(false);
      loadEquipment();
    } catch (error) {
      console.error('Fehler beim Erstellen:', error);
      alert('Fehler beim Erstellen des Equipment');
    }
  };

  const handleDelete = async (id: number, name: string) => {
    if (!confirm(`Möchten Sie "${name}" wirklich löschen?`)) {
      return;
    }

    try {
      const token = localStorage.getItem('token');
      await axios.delete(`http://localhost:3000/api/equipment/${id}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      alert('Equipment erfolgreich gelöscht!');
      loadEquipment();
    } catch (error) {
      console.error('Fehler beim Löschen:', error);
      alert('Fehler beim Löschen. Equipment wird möglicherweise von Quests verwendet.');
    }
  };

  const getRarityColor = (rarity: Equipment['rarity']) => {
    switch (rarity) {
      case 'common': return 'bg-gray-100 text-gray-800 border-gray-300';
      case 'uncommon': return 'bg-green-100 text-green-800 border-green-300';
      case 'rare': return 'bg-blue-100 text-blue-800 border-blue-300';
      case 'epic': return 'bg-purple-100 text-purple-800 border-purple-300';
      case 'legendary': return 'bg-orange-100 text-orange-800 border-orange-300';
    }
  };

  const getRarityLabel = (rarity: Equipment['rarity']) => {
    switch (rarity) {
      case 'common': return 'Gewöhnlich';
      case 'uncommon': return 'Ungewöhnlich';
      case 'rare': return 'Selten';
      case 'epic': return 'Episch';
      case 'legendary': return 'Legendär';
    }
  };

  if (loading) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-8">
        <div className="text-center">Lädt Equipment...</div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      <div className="flex items-center justify-between mb-8">
        <div>
          <button
            onClick={() => navigate('/dozent')}
            className="text-primary-600 hover:text-primary-700 mb-2 flex items-center"
          >
            ← Zurück zum Dashboard
          </button>
          <h1 className="text-4xl font-bold text-gray-900">🎒 Equipment-Verwaltung</h1>
          <p className="text-gray-600 mt-2">Verwalten Sie Gegenstände für Quest-Belohnungen</p>
        </div>
        <button
          onClick={() => setShowForm(!showForm)}
          className="bg-primary-600 hover:bg-primary-700 text-white px-6 py-3 rounded-lg font-semibold transition-colors"
        >
          {showForm ? '❌ Abbrechen' : '➕ Neues Equipment'}
        </button>
      </div>

      {/* Formular */}
      {showForm && (
        <div className="bg-white rounded-lg shadow-md p-6 mb-8">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">Neues Equipment erstellen</h2>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Name *
              </label>
              <input
                type="text"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                placeholder="z.B. SSH-Schlüssel"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Beschreibung *
              </label>
              <textarea
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                rows={3}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                placeholder="Beschreiben Sie, wofür dieser Gegenstand benötigt wird..."
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Seltenheit *
              </label>
              <select
                value={formData.rarity}
                onChange={(e) => setFormData({ ...formData, rarity: e.target.value as Equipment['rarity'] })}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
              >
                <option value="common">Gewöhnlich</option>
                <option value="uncommon">Ungewöhnlich</option>
                <option value="rare">Selten</option>
                <option value="epic">Episch</option>
                <option value="legendary">Legendär</option>
              </select>
            </div>

            <button
              type="submit"
              className="w-full bg-green-600 hover:bg-green-700 text-white py-3 rounded-lg font-semibold transition-colors"
            >
              ✅ Equipment erstellen
            </button>
          </form>
        </div>
      )}

      {/* Equipment-Liste */}
      <div className="bg-white rounded-lg shadow-md p-6">
        <h2 className="text-2xl font-bold text-gray-900 mb-4">
          Alle Equipment ({equipment.length})
        </h2>

        {equipment.length === 0 ? (
          <div className="text-center py-12">
            <div className="text-6xl mb-4">📦</div>
            <p className="text-gray-600">Noch keine Equipment vorhanden</p>
            <button
              onClick={() => setShowForm(true)}
              className="mt-4 text-primary-600 hover:text-primary-700 font-semibold"
            >
              Jetzt erstellen
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {equipment.map((item) => (
              <div
                key={item.id}
                className={`border-2 rounded-lg p-4 ${getRarityColor(item.rarity)}`}
              >
                <div className="flex items-start justify-between mb-2">
                  <h3 className="font-bold text-lg">{item.name}</h3>
                  <button
                    onClick={() => handleDelete(item.id, item.name)}
                    className="text-red-600 hover:text-red-700 text-sm font-semibold"
                  >
                    🗑️
                  </button>
                </div>
                
                <div className="mb-2">
                  <span className={`inline-block px-2 py-1 text-xs font-semibold rounded border ${getRarityColor(item.rarity)}`}>
                    {getRarityLabel(item.rarity)}
                  </span>
                </div>
                
                <p className="text-sm mb-2">{item.description}</p>
                
                <div className="text-xs text-gray-600 mt-2 pt-2 border-t border-current">
                  Erstellt: {new Date(item.created_at).toLocaleDateString('de-DE')}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Info-Box */}
      <div className="mt-6 bg-blue-50 border-2 border-blue-200 rounded-lg p-4">
        <h3 className="font-semibold text-blue-900 mb-2">💡 Hinweis</h3>
        <ul className="text-sm text-blue-800 space-y-1">
          <li>• Equipment kann als Belohnung bei Quest-Erstellung ausgewählt werden</li>
          <li>• Equipment kann als Voraussetzung für Quests festgelegt werden</li>
          <li>• Löschen ist nur möglich, wenn das Equipment nicht in Quests verwendet wird</li>
          <li>• Die Seltenheit ist rein visuell und beeinflusst nicht die Spielmechanik</li>
        </ul>
      </div>
    </div>
  );
}
