import { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { characterAPI, achievementAPI } from '../services/api';
import { Character } from '../types';

export default function CharacterDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [character, setCharacter] = useState<Character | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadCharacter();
  }, [id]);

  const loadCharacter = async () => {
    try {
      const response = await characterAPI.getById(Number(id));
      setCharacter(response.data);
      
      // Check for new achievements
      await achievementAPI.check(Number(id));
    } catch (error) {
      console.error('Fehler beim Laden des Charakters:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <div className="text-2xl text-gray-600">Laden...</div>
      </div>
    );
  }

  if (!character) {
    return (
      <div className="max-w-2xl mx-auto px-4 py-8 text-center">
        <h1 className="text-2xl font-bold text-gray-900">Charakter nicht gefunden</h1>
        <Link to="/dashboard" className="text-primary-600 hover:text-primary-700 mt-4 inline-block">
          Zurück zum Dashboard
        </Link>
      </div>
    );
  }

  const xpPercentage = (character.xp / character.xp_to_next_level) * 100;

  return (
    <div className="max-w-6xl mx-auto px-4 py-8">
      {/* Header */}
      <div className="mb-6">
        <Link to="/dashboard" className="text-primary-600 hover:text-primary-700 mb-4 inline-block">
          ← Zurück zum Dashboard
        </Link>
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-4xl font-bold text-gray-900">{character.name}</h1>
            <p className="text-xl text-gray-600 mt-2">{character.title}</p>
          </div>
          <div className="text-right">
            <div className="text-5xl font-bold text-primary-600">Level {character.level}</div>
          </div>
        </div>
      </div>

      {/* XP Bar */}
      <div className="bg-white rounded-lg shadow-md p-6 mb-6">
        <div className="flex justify-between text-sm text-gray-600 mb-2">
          <span className="font-medium">Erfahrungspunkte</span>
          <span>{character.xp} / {character.xp_to_next_level} XP</span>
        </div>
        <div className="w-full bg-gray-200 rounded-full h-4">
          <div 
            className="bg-primary-500 h-4 rounded-full transition-all"
            style={{ width: `${xpPercentage}%` }}
          />
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Stats */}
        <div className="lg:col-span-2">
          <div className="bg-white rounded-lg shadow-md p-6">
            <h2 className="text-2xl font-bold text-gray-900 mb-6">📊 Attribute</h2>
            <div className="space-y-4">
              <StatDisplay label="Programmierung" value={character.programmierung} icon="💻" />
              <StatDisplay label="Netzwerke" value={character.netzwerke} icon="🌐" />
              <StatDisplay label="Datenbanken" value={character.datenbanken} icon="🗄️" />
              <StatDisplay label="Hardware" value={character.hardware} icon="🖥️" />
              <StatDisplay label="Sicherheit" value={character.sicherheit} icon="🔒" />
              <StatDisplay label="Projektmanagement" value={character.projektmanagement} icon="📊" />
            </div>
          </div>
        </div>

        {/* Quick Actions */}
        <div className="space-y-6">
          <div className="bg-white rounded-lg shadow-md p-6">
            <h2 className="text-xl font-bold text-gray-900 mb-4">⚡ Aktionen</h2>
            <div className="space-y-3">
              <Link
                to={`/quests/${character.id}`}
                className="block w-full bg-primary-600 hover:bg-primary-700 text-white font-bold py-3 px-4 rounded-lg transition-colors text-center"
              >
                📜 Quests
              </Link>
              <Link
                to={`/achievements/${character.id}`}
                className="block w-full bg-green-600 hover:bg-green-700 text-white font-bold py-3 px-4 rounded-lg transition-colors text-center"
              >
                🏆 Achievements
              </Link>
              <Link
                to={`/inventory/${character.id}`}
                className="block w-full bg-purple-600 hover:bg-purple-700 text-white font-bold py-3 px-4 rounded-lg transition-colors text-center"
              >
                🎒 Inventar
              </Link>
              <button
                onClick={() => navigate('/leaderboard')}
                className="block w-full bg-yellow-600 hover:bg-yellow-700 text-white font-bold py-3 px-4 rounded-lg transition-colors"
              >
                👑 Rangliste
              </button>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-md p-6">
            <h2 className="text-xl font-bold text-gray-900 mb-4">📈 Statistik</h2>
            <div className="space-y-3">
              <div className="flex justify-between">
                <span className="text-gray-600">Gesamt-Stats:</span>
                <span className="font-bold">
                  {character.programmierung + character.netzwerke + character.datenbanken + 
                   character.hardware + character.sicherheit + character.projektmanagement}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Erstellt am:</span>
                <span className="text-sm">
                  {new Date(character.created_at).toLocaleDateString('de-DE')}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function StatDisplay({ label, value, icon }: { label: string; value: number; icon: string }) {
  return (
    <div>
      <div className="flex justify-between items-center mb-2">
        <span className="text-gray-700 font-medium">
          {icon} {label}
        </span>
        <span className="text-2xl font-bold text-gray-900">{value}</span>
      </div>
      <div className="w-full bg-gray-200 rounded-full h-3">
        <div 
          className="bg-green-500 h-3 rounded-full transition-all"
          style={{ width: `${value}%` }}
        />
      </div>
    </div>
  );
}
