import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '../services/api';

export default function CreateQuest() {
  const navigate = useNavigate();
  const user = JSON.parse(localStorage.getItem('user') || '{}');
  const [equipment, setEquipment] = useState<any[]>([]);
  
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    category: 'Programmierung',
    difficulty: 'easy',
    xp_scaling: 'scaled',
    xp_reward: 0,
    programmierung_reward: 0,
    netzwerke_reward: 0,
    datenbanken_reward: 0,
    hardware_reward: 0,
    sicherheit_reward: 0,
    projektmanagement_reward: 0,
    is_title_quest: false,
    title_reward: '',
    equipment_reward_id: '',
    required_equipment_id: '',
    min_level: 1,
    is_repeatable: false,
    repeat_interval: 'weekly',
    due_date: '',
    repeat_time: '12:00',
    repeat_day_of_week: 1,
    repeat_day_of_month: 1
  });

  useEffect(() => {
    loadEquipment();
  }, []);

  const loadEquipment = async () => {
    try {
      const res = await api.get('/equipment');
      setEquipment(res.data);
    } catch (error) {
      console.error('Fehler beim Laden der Equipment:', error);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      await api.post('/dozent/quests', {
        ...formData,
        equipment_reward_id: formData.equipment_reward_id || null,
        required_equipment_id: formData.required_equipment_id || null,
        repeat_interval: formData.is_repeatable ? formData.repeat_interval : null,
        due_date: formData.due_date || null,
        created_by_user_id: user.id
      });
      
      alert('Quest erfolgreich erstellt!');
      navigate('/dozent/quests');
    } catch (error) {
      console.error('Fehler beim Erstellen der Quest:', error);
      alert('Fehler beim Erstellen der Quest');
    }
  };

  return (
    <div className="max-w-4xl mx-auto p-8">
      <h1 className="text-3xl font-bold text-gray-900 mb-8">Quest erstellen</h1>
      
      <form onSubmit={handleSubmit} className="bg-white shadow-md rounded-lg p-6 space-y-6">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Titel</label>
          <input
            type="text"
            required
            value={formData.title}
            onChange={(e) => setFormData({ ...formData, title: e.target.value })}
            className="w-full border border-gray-300 rounded-lg px-4 py-2"
          />
        </div>
        
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Beschreibung</label>
          <textarea
            required
            value={formData.description}
            onChange={(e) => setFormData({ ...formData, description: e.target.value })}
            rows={4}
            className="w-full border border-gray-300 rounded-lg px-4 py-2"
          />
        </div>
        
        <div className="grid grid-cols-3 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Kategorie</label>
            <select
              value={formData.category}
              onChange={(e) => setFormData({ ...formData, category: e.target.value })}
              className="w-full border border-gray-300 rounded-lg px-4 py-2"
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
            <label className="block text-sm font-medium text-gray-700 mb-2">Schwierigkeit</label>
            <select
              value={formData.difficulty}
              onChange={(e) => setFormData({ ...formData, difficulty: e.target.value })}
              className="w-full border border-gray-300 rounded-lg px-4 py-2"
            >
              <option value="easy">Einfach (50 XP)</option>
              <option value="medium">Mittel (100 XP)</option>
              <option value="hard">Schwer (200 XP)</option>
            </select>
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Min. Level</label>
            <input
              type="number"
              min="1"
              value={formData.min_level}
              onChange={(e) => setFormData({ ...formData, min_level: parseInt(e.target.value) })}
              className="w-full border border-gray-300 rounded-lg px-4 py-2"
            />
          </div>
        </div>
        
        {/* XP-Skalierung */}
        <div className="bg-blue-50 p-4 rounded-lg">
          <h3 className="text-lg font-semibold text-gray-900 mb-3">⚡ XP-Vergabe</h3>
          <div className="space-y-3">
            <div className="flex items-center space-x-4">
              <label className="flex items-center space-x-2">
                <input
                  type="radio"
                  name="xp_scaling"
                  value="scaled"
                  checked={formData.xp_scaling === 'scaled'}
                  onChange={(e) => setFormData({ ...formData, xp_scaling: e.target.value })}
                  className="w-4 h-4"
                />
                <span className="text-sm font-medium text-gray-700">
                  Skalierend (automatisch basierend auf Level & Schwierigkeit)
                </span>
              </label>
            </div>
            
            <div className="flex items-center space-x-4">
              <label className="flex items-center space-x-2">
                <input
                  type="radio"
                  name="xp_scaling"
                  value="fixed"
                  checked={formData.xp_scaling === 'fixed'}
                  onChange={(e) => setFormData({ ...formData, xp_scaling: e.target.value })}
                  className="w-4 h-4"
                />
                <span className="text-sm font-medium text-gray-700">Fester XP-Wert</span>
              </label>
              {formData.xp_scaling === 'fixed' && (
                <input
                  type="number"
                  min="1"
                  placeholder="XP-Wert"
                  value={formData.xp_reward || ''}
                  onChange={(e) => setFormData({ ...formData, xp_reward: parseInt(e.target.value) || 0 })}
                  className="flex-1 border border-gray-300 rounded-lg px-4 py-2"
                  required
                />
              )}
            </div>
          </div>
        </div>
        
        {/* Wiederholbarkeit */}
        <div className="bg-green-50 p-4 rounded-lg">
          <h3 className="text-lg font-semibold text-gray-900 mb-3">🔄 Wiederholbarkeit</h3>
          <div className="space-y-3">
            <div className="flex items-center space-x-4">
              <input
                type="checkbox"
                id="is_repeatable"
                checked={formData.is_repeatable}
                onChange={(e) => setFormData({ ...formData, is_repeatable: e.target.checked })}
                className="w-4 h-4"
              />
              <label htmlFor="is_repeatable" className="text-sm font-medium text-gray-700">
                Quest ist wiederholbar
              </label>
            </div>
            
            {formData.is_repeatable && (
              <div className="space-y-3">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Wiederholungsintervall
                  </label>
                  <select
                    value={formData.repeat_interval}
                    onChange={(e) => setFormData({ ...formData, repeat_interval: e.target.value })}
                    className="w-full border border-gray-300 rounded-lg px-4 py-2"
                  >
                    <option value="daily">Täglich</option>
                    <option value="weekly">Wöchentlich</option>
                    <option value="monthly">Monatlich</option>
                  </select>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Uhrzeit der Wiederholung
                  </label>
                  <input
                    type="time"
                    value={formData.repeat_time}
                    onChange={(e) => setFormData({ ...formData, repeat_time: e.target.value })}
                    className="w-full border border-gray-300 rounded-lg px-4 py-2"
                    required
                  />
                </div>
                
                {formData.repeat_interval === 'weekly' && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Wochentag
                    </label>
                    <select
                      value={formData.repeat_day_of_week}
                      onChange={(e) => setFormData({ ...formData, repeat_day_of_week: parseInt(e.target.value) })}
                      className="w-full border border-gray-300 rounded-lg px-4 py-2"
                    >
                      <option value="0">Sonntag</option>
                      <option value="1">Montag</option>
                      <option value="2">Dienstag</option>
                      <option value="3">Mittwoch</option>
                      <option value="4">Donnerstag</option>
                      <option value="5">Freitag</option>
                      <option value="6">Samstag</option>
                    </select>
                  </div>
                )}
                
                {formData.repeat_interval === 'monthly' && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Tag des Monats (1-31)
                    </label>
                    <input
                      type="number"
                      min="1"
                      max="31"
                      value={formData.repeat_day_of_month}
                      onChange={(e) => setFormData({ ...formData, repeat_day_of_month: parseInt(e.target.value) })}
                      className="w-full border border-gray-300 rounded-lg px-4 py-2"
                      required
                    />
                    <p className="text-xs text-gray-500 mt-1">
                      Bei Monaten mit weniger Tagen wird der letzte Tag des Monats verwendet
                    </p>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
        
        {/* Abgabefrist */}
        <div className="bg-yellow-50 p-4 rounded-lg">
          <h3 className="text-lg font-semibold text-gray-900 mb-3">📅 Abgabefrist</h3>
          <div className="space-y-3">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Frist für Abgabe (optional)
            </label>
            <input
              type="datetime-local"
              value={formData.due_date}
              onChange={(e) => setFormData({ ...formData, due_date: e.target.value })}
              className="w-full border border-gray-300 rounded-lg px-4 py-2"
            />
            <p className="text-sm text-gray-500">
              Nach dieser Zeit können keine Abgaben mehr eingereicht werden
            </p>
          </div>
        </div>
        
        <div>
          <h3 className="text-lg font-semibold text-gray-900 mb-3">Skill-Belohnungen</h3>
          <div className="grid grid-cols-3 gap-4">
            {['programmierung', 'netzwerke', 'datenbanken', 'hardware', 'sicherheit', 'projektmanagement'].map((skill) => (
              <div key={skill}>
                <label className="block text-sm font-medium text-gray-700 mb-1 capitalize">
                  {skill}
                </label>
                <input
                  type="number"
                  min="0"
                  max="20"
                  value={(formData as any)[`${skill}_reward`]}
                  onChange={(e) => setFormData({ ...formData, [`${skill}_reward`]: parseInt(e.target.value) || 0 })}
                  className="w-full border border-gray-300 rounded-lg px-4 py-2"
                />
              </div>
            ))}
          </div>
        </div>
        
        <div className="flex items-center space-x-4">
          <input
            type="checkbox"
            id="is_title_quest"
            checked={formData.is_title_quest}
            onChange={(e) => setFormData({ ...formData, is_title_quest: e.target.checked })}
            className="w-4 h-4"
          />
          <label htmlFor="is_title_quest" className="text-sm font-medium text-gray-700">
            Titel-Quest
          </label>
          {formData.is_title_quest && (
            <input
              type="text"
              placeholder="Titel-Belohnung"
              value={formData.title_reward}
              onChange={(e) => setFormData({ ...formData, title_reward: e.target.value })}
              className="flex-1 border border-gray-300 rounded-lg px-4 py-2"
            />
          )}
        </div>
        
        <div>
          <h3 className="text-lg font-semibold text-gray-900 mb-3">🎁 Gegenstand-Belohnung</h3>
          <select
            value={formData.equipment_reward_id}
            onChange={(e) => setFormData({ ...formData, equipment_reward_id: e.target.value })}
            className="w-full border border-gray-300 rounded-lg px-4 py-2"
          >
            <option value="">Kein Gegenstand</option>
            {equipment.map((eq) => (
              <option key={eq.id} value={eq.id}>
                {eq.name} ({eq.rarity})
              </option>
            ))}
          </select>
        </div>
        
        <div>
          <h3 className="text-lg font-semibold text-gray-900 mb-3">🔒 Benötigter Gegenstand</h3>
          <select
            value={formData.required_equipment_id}
            onChange={(e) => setFormData({ ...formData, required_equipment_id: e.target.value })}
            className="w-full border border-gray-300 rounded-lg px-4 py-2"
          >
            <option value="">Kein Gegenstand erforderlich</option>
            {equipment.map((eq) => (
              <option key={eq.id} value={eq.id}>
                {eq.name} ({eq.rarity})
              </option>
            ))}
          </select>
          <p className="text-sm text-gray-500 mt-1">
            Quest ist nur verfügbar, wenn NWK diesen Gegenstand besitzt
          </p>
        </div>
        
        <div className="flex space-x-4">
          <button
            type="submit"
            className="flex-1 bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 px-6 rounded-lg transition-colors"
          >
            Quest erstellen
          </button>
          <button
            type="button"
            onClick={() => navigate('/dozent/quests')}
            className="px-6 py-3 border border-gray-300 rounded-lg hover:bg-gray-50"
          >
            Abbrechen
          </button>
        </div>
      </form>
    </div>
  );
}
