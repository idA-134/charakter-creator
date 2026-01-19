import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { characterAPI } from '../services/api';
import { Character } from '../types';
import CharacterCard from '../components/CharacterCard';

interface Props {
  user: any;
}

export default function Dashboard({ user }: Props) {
  const [characters, setCharacters] = useState<Character[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadCharacters();
  }, []);

  const loadCharacters = async () => {
    try {
      const response = await characterAPI.getByUser(user.id);
      setCharacters(response.data);
    } catch (error) {
      console.error('Fehler beim Laden der Charaktere:', error);
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

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-4xl font-bold text-gray-900">Dashboard</h1>
          <p className="text-gray-600 mt-2">Willkommen zurück, {user.username}!</p>
        </div>
        <Link
          to="/character/create"
          className="bg-primary-600 hover:bg-primary-700 text-white font-bold py-3 px-6 rounded-lg transition-colors"
        >
          + Neuer Charakter
        </Link>
      </div>

      {characters.length === 0 ? (
        <div className="bg-white rounded-lg shadow-md p-12 text-center">
          <div className="text-6xl mb-4">🎮</div>
          <h2 className="text-2xl font-bold text-gray-900 mb-2">
            Noch keine Charaktere
          </h2>
          <p className="text-gray-600 mb-6">
            Erstelle deinen ersten Charakter und starte deine Reise!
          </p>
          <Link
            to="/character/create"
            className="inline-block bg-primary-600 hover:bg-primary-700 text-white font-bold py-3 px-8 rounded-lg transition-colors"
          >
            Charakter erstellen
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {characters.map((character) => (
            <Link key={character.id} to={`/character/${character.id}`}>
              <CharacterCard character={character} />
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
