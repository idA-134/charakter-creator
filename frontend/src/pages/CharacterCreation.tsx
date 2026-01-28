import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { characterAPI } from '../services/api';

interface Props {
  user: any;
}

export default function CharacterCreation({ user }: Props) {
  const [name, setName] = useState('');
  const [backstory, setBackstory] = useState('');
  const [error, setError] = useState('');
  const navigate = useNavigate();

  const MAX_POINTS = 60;
  const MAX_PER_ATTRIBUTE = 20;

  const [attributes, setAttributes] = useState({
    programmierung: 0,
    netzwerke: 0,
    datenbanken: 0,
    hardware: 0,
    sicherheit: 0,
    projektmanagement: 0
  });

  const totalPoints = Object.values(attributes).reduce((sum, val) => sum + val, 0);
  const remainingPoints = MAX_POINTS - totalPoints;

  const handleAttributeChange = (key: keyof typeof attributes, value: number) => {
    setError('');
    const clamped = Math.max(0, Math.min(MAX_PER_ATTRIBUTE, value));
    const nextTotal = totalPoints - attributes[key] + clamped;

    if (nextTotal > MAX_POINTS) {
      setError('Du hast nicht genügend Punkte übrig');
      return;
    }

    setAttributes((prev) => ({
      ...prev,
      [key]: clamped
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (name.length < 3) {
      setError('Name muss mindestens 3 Zeichen lang sein');
      return;
    }

    if (remainingPoints !== 0) {
      setError('Bitte verteile exakt 60 Punkte auf die Attribute');
      return;
    }

    try {
      const response = await characterAPI.create({
        user_id: user.id,
        name,
        backstory: backstory.trim() || undefined,
        programmierung: attributes.programmierung,
        netzwerke: attributes.netzwerke,
        datenbanken: attributes.datenbanken,
        hardware: attributes.hardware,
        sicherheit: attributes.sicherheit,
        projektmanagement: attributes.projektmanagement
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
              placeholder="z.B. Kurt Dagel"
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent text-lg"
              required
              maxLength={100}
            />
            <p className="mt-2 text-sm text-gray-500">
              Wähle einen Namen für deinen Charakter (3-100 Zeichen)
            </p>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Hintergrundgeschichte (optional)
            </label>
            <textarea
              value={backstory}
              onChange={(e) => setBackstory(e.target.value)}
              placeholder="Erzähle kurz, woher dein Charakter kommt und was ihn antreibt..."
              rows={4}
              maxLength={1000}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
            />
            <p className="mt-2 text-sm text-gray-500">
              {backstory.length}/1000 Zeichen
            </p>
          </div>

          <div className="p-4 bg-gray-50 rounded-lg">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-lg font-semibold text-gray-900">Start-Attribute</h3>
              <div className={`text-sm font-bold ${remainingPoints === 0 ? 'text-green-600' : 'text-gray-700'}`}>
                Verfügbare Punkte: {remainingPoints}
              </div>
            </div>
            <p className="text-sm text-gray-600 mb-4">
              Verteilt insgesamt {MAX_POINTS} Punkte. Maximal {MAX_PER_ATTRIBUTE} pro Attribut.
            </p>
            <div className="space-y-3">
              {([
                { key: 'programmierung', label: '💻 Programmierung' },
                { key: 'netzwerke', label: '🌐 Netzwerke' },
                { key: 'datenbanken', label: '🗄️ Datenbanken' },
                { key: 'hardware', label: '🖥️ Hardware' },
                { key: 'sicherheit', label: '🔒 Sicherheit' },
                { key: 'projektmanagement', label: '📊 Projektmanagement' }
              ] as const).map((attr) => (
                <div key={attr.key} className="flex items-center gap-3">
                  <div className="flex-1 text-sm font-medium text-gray-700">
                    {attr.label}
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => handleAttributeChange(attr.key, attributes[attr.key] - 1)}
                      className="px-2 py-1 rounded-md border border-gray-300 text-gray-700 hover:bg-gray-100"
                      disabled={attributes[attr.key] <= 0}
                    >
                      -
                    </button>
                    <input
                      type="number"
                      min={0}
                      max={MAX_PER_ATTRIBUTE}
                      value={attributes[attr.key]}
                      onChange={(e) => handleAttributeChange(attr.key, Number(e.target.value))}
                      className="w-16 text-center border border-gray-300 rounded-md py-1"
                    />
                    <button
                      type="button"
                      onClick={() => handleAttributeChange(attr.key, attributes[attr.key] + 1)}
                      className="px-2 py-1 rounded-md border border-gray-300 text-gray-700 hover:bg-gray-100"
                      disabled={attributes[attr.key] >= MAX_PER_ATTRIBUTE}
                    >
                      +
                    </button>
                  </div>
                </div>
              ))}
            </div>
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
