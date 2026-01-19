import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { achievementAPI, characterAPI } from '../services/api';
import { Achievement, Character } from '../types';

export default function Achievements() {
  const { characterId } = useParams<{ characterId: string }>();
  const [achievements, setAchievements] = useState<Achievement[]>([]);
  const [character, setCharacter] = useState<Character | null>(null);
  const [filter, setFilter] = useState<string>('all');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadData();
  }, [characterId]);

  const loadData = async () => {
    try {
      const [achievementsRes, charRes] = await Promise.all([
        achievementAPI.getByCharacter(Number(characterId)),
        characterAPI.getById(Number(characterId))
      ]);
      setAchievements(achievementsRes.data);
      setCharacter(charRes.data);
    } catch (error) {
      console.error('Fehler beim Laden:', error);
    } finally {
      setLoading(false);
    }
  };

  const filteredAchievements = achievements.filter(achievement => {
    if (filter === 'all') return true;
    if (filter === 'unlocked') return achievement.unlocked;
    if (filter === 'locked') return !achievement.unlocked;
    return achievement.category === filter;
  });

  const unlockedCount = achievements.filter(a => a.unlocked).length;

  if (loading) {
    return <div className="flex justify-center items-center min-h-screen">Laden...</div>;
  }

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      <div className="mb-6">
        <Link to={`/character/${characterId}`} className="text-primary-600 hover:text-primary-700">
          ← Zurück zum Charakter
        </Link>
        {character && (
          <>
            <h1 className="text-4xl font-bold text-gray-900 mt-4">
              🏆 Achievements für {character.name}
            </h1>
            <p className="text-gray-600 mt-2">
              {unlockedCount} von {achievements.length} freigeschaltet
            </p>
          </>
        )}
      </div>

      {/* Progress Bar */}
      <div className="bg-white rounded-lg shadow-md p-6 mb-6">
        <div className="flex justify-between text-sm text-gray-600 mb-2">
          <span className="font-medium">Fortschritt</span>
          <span>{unlockedCount} / {achievements.length}</span>
        </div>
        <div className="w-full bg-gray-200 rounded-full h-4">
          <div 
            className="bg-green-500 h-4 rounded-full transition-all"
            style={{ width: `${(unlockedCount / achievements.length) * 100}%` }}
          />
        </div>
      </div>

      {/* Filter */}
      <div className="bg-white rounded-lg shadow-md p-4 mb-6">
        <div className="flex flex-wrap gap-2">
          <FilterButton active={filter === 'all'} onClick={() => setFilter('all')}>
            Alle
          </FilterButton>
          <FilterButton active={filter === 'unlocked'} onClick={() => setFilter('unlocked')}>
            Freigeschaltet
          </FilterButton>
          <FilterButton active={filter === 'locked'} onClick={() => setFilter('locked')}>
            Gesperrt
          </FilterButton>
          <div className="border-l mx-2"></div>
          <FilterButton active={filter === 'skill'} onClick={() => setFilter('skill')}>
            Skill
          </FilterButton>
          <FilterButton active={filter === 'level'} onClick={() => setFilter('level')}>
            Level
          </FilterButton>
          <FilterButton active={filter === 'quest'} onClick={() => setFilter('quest')}>
            Quest
          </FilterButton>
          <FilterButton active={filter === 'special'} onClick={() => setFilter('special')}>
            Spezial
          </FilterButton>
        </div>
      </div>

      {/* Achievements */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredAchievements.map((achievement) => (
          <AchievementCard key={achievement.id} achievement={achievement} />
        ))}
      </div>

      {filteredAchievements.length === 0 && (
        <div className="text-center py-12 bg-white rounded-lg shadow-md">
          <div className="text-6xl mb-4">🔍</div>
          <p className="text-gray-600">Keine Achievements gefunden</p>
        </div>
      )}
    </div>
  );
}

function FilterButton({ active, onClick, children }: any) {
  return (
    <button
      onClick={onClick}
      className={`px-4 py-2 rounded-lg font-medium transition-colors ${
        active 
          ? 'bg-primary-600 text-white' 
          : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
      }`}
    >
      {children}
    </button>
  );
}

function AchievementCard({ achievement }: { achievement: Achievement }) {
  return (
    <div className={`bg-white rounded-lg shadow-md p-6 transition-all ${
      achievement.unlocked 
        ? 'border-2 border-yellow-400 hover:shadow-xl' 
        : 'opacity-60 hover:opacity-80'
    }`}>
      <div className="flex items-start justify-between mb-4">
        <div className="text-4xl">
          {achievement.unlocked ? achievement.icon : '🔒'}
        </div>
        {achievement.unlocked && (
          <span className="bg-yellow-100 text-yellow-800 px-3 py-1 rounded-full text-xs font-bold">
            Freigeschaltet
          </span>
        )}
      </div>

      <h3 className="text-xl font-bold text-gray-900 mb-2">
        {achievement.name}
      </h3>
      <p className="text-gray-600 text-sm mb-4">
        {achievement.description}
      </p>

      <div className="border-t pt-4 flex justify-between items-center">
        <span className="text-sm text-gray-500">
          {achievement.category}
        </span>
        <span className="text-primary-600 font-bold">
          +{achievement.xp_reward} XP
        </span>
      </div>

      {achievement.unlocked && achievement.unlocked_at && (
        <div className="mt-2 text-xs text-gray-500">
          Freigeschaltet: {new Date(achievement.unlocked_at).toLocaleDateString('de-DE')}
        </div>
      )}

      {!achievement.unlocked && (
        <div className="mt-4 bg-gray-50 rounded p-3 text-sm text-gray-600">
          📋 Anforderung: {achievement.requirement_type} = {achievement.requirement_value}
        </div>
      )}
    </div>
  );
}
