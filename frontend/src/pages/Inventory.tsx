import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { api } from '../services/api';

export default function Inventory() {
  const { characterId } = useParams<{ characterId: string }>();
  const [equipment, setEquipment] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadInventory();
  }, [characterId]);

  const loadInventory = async () => {
    try {
      const res = await api.get(`/equipment/character/${characterId}`);
      setEquipment(res.data);
    } catch (error) {
      console.error('Fehler beim Laden des Inventars:', error);
    } finally {
      setLoading(false);
    }
  };

  const getRarityColor = (rarity: string) => {
    const colors: any = {
      common: 'bg-gray-100 text-gray-800 border-gray-300',
      uncommon: 'bg-green-100 text-green-800 border-green-300',
      rare: 'bg-blue-100 text-blue-800 border-blue-300',
      epic: 'bg-purple-100 text-purple-800 border-purple-300',
      legendary: 'bg-orange-100 text-orange-800 border-orange-300'
    };
    return colors[rarity] || colors.common;
  };

  if (loading) {
    return (
      <div className="max-w-7xl mx-auto p-8">
        <div className="text-center py-12">
          <div className="text-6xl mb-4">⏳</div>
          <p className="text-gray-600">Lade Inventar...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto p-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">🎒 Inventar</h1>
        <p className="text-gray-600">Deine gesammelten Gegenstände</p>
      </div>

      {equipment.length === 0 ? (
        <div className="text-center py-12 bg-white rounded-lg shadow-md">
          <div className="text-6xl mb-4">📦</div>
          <p className="text-gray-600 text-lg mb-2">Dein Inventar ist leer</p>
          <p className="text-gray-500 text-sm">Schließe Quests ab um Gegenstände zu erhalten</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {equipment.map((item) => (
            <div
              key={item.id}
              className={`bg-white rounded-lg shadow-md p-6 border-2 ${getRarityColor(item.rarity)} hover:shadow-xl transition-shadow`}
            >
              <div className="flex justify-between items-start mb-3">
                <h3 className="text-xl font-bold text-gray-900">{item.name}</h3>
                <span className={`px-3 py-1 rounded-full text-xs font-bold uppercase ${getRarityColor(item.rarity)}`}>
                  {item.rarity}
                </span>
              </div>
              
              {item.description && (
                <p className="text-gray-600 text-sm mb-4">{item.description}</p>
              )}
              
              <div className="border-t pt-3 text-xs text-gray-500">
                <div>Erhalten: {new Date(item.acquired_at).toLocaleDateString('de-DE')}</div>
              </div>
            </div>
          ))}
        </div>
      )}

      <div className="mt-8 bg-blue-50 border border-blue-200 rounded-lg p-4">
        <h3 className="font-semibold text-blue-900 mb-2">💡 Über Gegenstände</h3>
        <ul className="text-sm text-blue-800 space-y-1">
          <li>• Gegenstände erhältst du als Belohnung für abgeschlossene Quests</li>
          <li>• Manche Quests benötigen spezielle Gegenstände um freigeschaltet zu werden</li>
          <li>• Sammle seltene Gegenstände um auf fortgeschrittene Quests zugreifen zu können</li>
        </ul>
      </div>
    </div>
  );
}
