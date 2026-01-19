import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { characterAPI } from '../services/api';

interface Props {
  user: any;
}

export default function CharacterCreation({ user }: Props) {
  const [name, setName] = useState('');
  const [error, setError] = useState('');
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (name.length < 3) {
      setError('Name muss mindestens 3 Zeichen lang sein');
      return;
    }

    try {
      const response = await characterAPI.create({
        user_id: user.id,
        name
      });
      navigate(`/character/${response.data.id}`);
    } catch (err: any) {
      setError(err.response?.data?.error || 'Fehler beim Erstellen des Charakters');
    }
  };

  return (
    <div className="max-w-2xl mx-auto px-4 py-8">
      <div className="bg-white rounded-lg shadow-md p-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-6">
          Neuen Charakter erstellen
        </h1>

        <div className="mb-8 p-6 bg-primary-50 rounded-lg">
          <h2 className="text-xl font-bold text-gray-900 mb-3">
            🎮 Willkommen beim Charakter-Creator!
          </h2>
          <p className="text-gray-700 mb-2">
            Erstelle deinen eigenen IT-Charakter und entwickle deine Skills in:
          </p>
          <ul className="grid grid-cols-2 gap-2 mt-4">
            <li className="flex items-center text-gray-700">
              <span className="mr-2">💻</span> Programmierung
            </li>
            <li className="flex items-center text-gray-700">
              <span className="mr-2">🌐</span> Netzwerke
            </li>
            <li className="flex items-center text-gray-700">
              <span className="mr-2">🗄️</span> Datenbanken
            </li>
            <li className="flex items-center text-gray-700">
              <span className="mr-2">🖥️</span> Hardware
            </li>
            <li className="flex items-center text-gray-700">
              <span className="mr-2">🔒</span> Sicherheit
            </li>
            <li className="flex items-center text-gray-700">
              <span className="mr-2">📊</span> Projektmanagement
            </li>
          </ul>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Charakter Name
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="z.B. Max Mustermann"
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent text-lg"
              required
              maxLength={100}
            />
            <p className="mt-2 text-sm text-gray-500">
              Wähle einen Namen für deinen Charakter (3-100 Zeichen)
            </p>
          </div>

          {error && (
            <div className="p-3 bg-red-50 text-red-800 rounded-lg text-sm">
              {error}
            </div>
          )}

          <div className="flex space-x-4">
            <button
              type="button"
              onClick={() => navigate('/dashboard')}
              className="flex-1 bg-gray-200 hover:bg-gray-300 text-gray-700 font-bold py-3 px-4 rounded-lg transition-colors"
            >
              Abbrechen
            </button>
            <button
              type="submit"
              className="flex-1 bg-primary-600 hover:bg-primary-700 text-white font-bold py-3 px-4 rounded-lg transition-colors"
            >
              Charakter erstellen
            </button>
          </div>
        </form>

        <div className="mt-8 p-4 bg-gray-50 rounded-lg">
          <h3 className="font-bold text-gray-900 mb-2">ℹ️ Hinweis</h3>
          <p className="text-sm text-gray-600">
            Du startest als "Azubi" auf Level 1 mit Basis-Attributen. 
            Durch Quests und Aufgaben kannst du XP sammeln, leveln und deine Skills verbessern!
          </p>
        </div>
      </div>
    </div>
  );
}
