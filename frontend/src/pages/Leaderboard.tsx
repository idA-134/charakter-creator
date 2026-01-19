import { useState, useEffect } from 'react';
import { leaderboardAPI } from '../services/api';
import { LeaderboardEntry } from '../types';

export default function Leaderboard() {
  const [category, setCategory] = useState<'level' | 'stats' | 'achievements' | 'quests'>('level');
  const [entries, setEntries] = useState<LeaderboardEntry[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadLeaderboard();
  }, [category]);

  const loadLeaderboard = async () => {
    setLoading(true);
    try {
      let response;
      switch (category) {
        case 'level':
          response = await leaderboardAPI.byLevel();
          break;
        case 'stats':
          response = await leaderboardAPI.byStats();
          break;
        case 'achievements':
          response = await leaderboardAPI.byAchievements();
          break;
        case 'quests':
          response = await leaderboardAPI.byQuests();
          break;
      }
      setEntries(response.data);
    } catch (error) {
      console.error('Fehler beim Laden der Rangliste:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-6xl mx-auto px-4 py-8">
      <div className="mb-8">
        <h1 className="text-4xl font-bold text-gray-900">👑 Rangliste</h1>
        <p className="text-gray-600 mt-2">Die besten Charaktere im Vergleich</p>
      </div>

      {/* Category Tabs */}
      <div className="bg-white rounded-lg shadow-md p-4 mb-6">
        <div className="flex gap-2">
          <CategoryTab 
            active={category === 'level'} 
            onClick={() => setCategory('level')}
          >
            ⭐ Level
          </CategoryTab>
          <CategoryTab 
            active={category === 'stats'} 
            onClick={() => setCategory('stats')}
          >
            📊 Gesamt-Stats
          </CategoryTab>
          <CategoryTab 
            active={category === 'achievements'} 
            onClick={() => setCategory('achievements')}
          >
            🏆 Achievements
          </CategoryTab>
          <CategoryTab 
            active={category === 'quests'} 
            onClick={() => setCategory('quests')}
          >
            📜 Quests
          </CategoryTab>
        </div>
      </div>

      {/* Leaderboard */}
      {loading ? (
        <div className="flex justify-center py-12">
          <div className="text-2xl text-gray-600">Laden...</div>
        </div>
      ) : (
        <div className="bg-white rounded-lg shadow-md overflow-hidden">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Rang
                </th>
                <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Charakter
                </th>
                <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Spieler
                </th>
                <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Level
                </th>
                <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  {category === 'level' && 'XP'}
                  {category === 'stats' && 'Gesamt-Stats'}
                  {category === 'achievements' && 'Achievements'}
                  {category === 'quests' && 'Quests'}
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {entries.map((entry, index) => (
                <LeaderboardRow 
                  key={entry.id} 
                  entry={entry} 
                  rank={index + 1} 
                  category={category}
                />
              ))}
            </tbody>
          </table>

          {entries.length === 0 && (
            <div className="text-center py-12 text-gray-600">
              Noch keine Einträge vorhanden
            </div>
          )}
        </div>
      )}
    </div>
  );
}

function CategoryTab({ active, onClick, children }: any) {
  return (
    <button
      onClick={onClick}
      className={`flex-1 px-6 py-3 rounded-lg font-medium transition-colors ${
        active 
          ? 'bg-primary-600 text-white' 
          : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
      }`}
    >
      {children}
    </button>
  );
}

function LeaderboardRow({ entry, rank, category }: any) {
  const getRankIcon = (rank: number) => {
    switch (rank) {
      case 1: return '🥇';
      case 2: return '🥈';
      case 3: return '🥉';
      default: return rank;
    }
  };

  const getValue = () => {
    switch (category) {
      case 'level':
        return `${entry.xp} XP`;
      case 'stats':
        return entry.total_stats;
      case 'achievements':
        return entry.achievement_count;
      case 'quests':
        return entry.completed_quests;
    }
  };

  return (
    <tr className={rank <= 3 ? 'bg-yellow-50' : ''}>
      <td className="px-6 py-4 whitespace-nowrap">
        <div className="text-2xl font-bold">
          {getRankIcon(rank)}
        </div>
      </td>
      <td className="px-6 py-4 whitespace-nowrap">
        <div className="text-sm font-medium text-gray-900">{entry.name}</div>
        <div className="text-sm text-gray-500">{entry.title}</div>
      </td>
      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
        {entry.username}
      </td>
      <td className="px-6 py-4 whitespace-nowrap">
        <span className="px-3 py-1 inline-flex text-sm leading-5 font-semibold rounded-full bg-primary-100 text-primary-800">
          Level {entry.level}
        </span>
      </td>
      <td className="px-6 py-4 whitespace-nowrap text-sm font-bold text-gray-900">
        {getValue()}
      </td>
    </tr>
  );
}
