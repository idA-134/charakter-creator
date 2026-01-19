import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { questAPI, characterAPI, api } from '../services/api';
import { Quest, Character } from '../types';

export default function Quests() {
  const { characterId } = useParams<{ characterId: string }>();
  const [quests, setQuests] = useState<Quest[]>([]);
  const [character, setCharacter] = useState<Character | null>(null);
  const [filter, setFilter] = useState<string>('all');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadData();
  }, [characterId]);

  const loadData = async () => {
    try {
      const [questsRes, charRes] = await Promise.all([
        questAPI.getByCharacter(Number(characterId)),
        characterAPI.getById(Number(characterId))
      ]);
      setQuests(questsRes.data);
      setCharacter(charRes.data);
    } catch (error) {
      console.error('Fehler beim Laden:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleStartQuest = async (questId: number) => {
    try {
      await questAPI.start(questId, Number(characterId));
      loadData();
    } catch (error) {
      console.error('Fehler beim Starten der Quest:', error);
    }
  };

  const handleCompleteQuest = async (questId: number) => {
    try {
      await questAPI.complete(questId, Number(characterId));
      loadData();
    } catch (error) {
      console.error('Fehler beim Abschließen der Quest:', error);
    }
  };

  const filteredQuests = quests.filter(quest => {
    if (filter === 'all') return true;
    if (filter === 'available') return quest.status === 'available';
    if (filter === 'in_progress') return quest.status === 'in_progress';
    if (filter === 'completed') return quest.status === 'completed';
    return quest.category === filter;
  });

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
          <h1 className="text-4xl font-bold text-gray-900 mt-4">
            📜 Quests für {character.name}
          </h1>
        )}
      </div>

      {/* Filter */}
      <div className="bg-white rounded-lg shadow-md p-4 mb-6">
        <div className="flex flex-wrap gap-2">
          <FilterButton active={filter === 'all'} onClick={() => setFilter('all')}>
            Alle
          </FilterButton>
          <FilterButton active={filter === 'available'} onClick={() => setFilter('available')}>
            Verfügbar
          </FilterButton>
          <FilterButton active={filter === 'in_progress'} onClick={() => setFilter('in_progress')}>
            In Bearbeitung
          </FilterButton>
          <FilterButton active={filter === 'completed'} onClick={() => setFilter('completed')}>
            Abgeschlossen
          </FilterButton>
          <div className="border-l mx-2"></div>
          <FilterButton active={filter === 'programmierung'} onClick={() => setFilter('programmierung')}>
            💻 Programmierung
          </FilterButton>
          <FilterButton active={filter === 'netzwerke'} onClick={() => setFilter('netzwerke')}>
            🌐 Netzwerke
          </FilterButton>
          <FilterButton active={filter === 'datenbanken'} onClick={() => setFilter('datenbanken')}>
            🗄️ Datenbanken
          </FilterButton>
          <FilterButton active={filter === 'sicherheit'} onClick={() => setFilter('sicherheit')}>
            🔒 Sicherheit
          </FilterButton>
        </div>
      </div>

      {/* Quests */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {filteredQuests.map((quest) => (
          <QuestCard 
            key={quest.id} 
            quest={quest}
            onStart={handleStartQuest}
            onComplete={handleCompleteQuest}
          />
        ))}
      </div>

      {filteredQuests.length === 0 && (
        <div className="text-center py-12 bg-white rounded-lg shadow-md">
          <div className="text-6xl mb-4">🔍</div>
          <p className="text-gray-600">Keine Quests gefunden</p>
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

function QuestCard({ quest, onStart, onComplete }: any) {
  const { characterId } = useParams<{ characterId: string }>();
  const [showSubmitForm, setShowSubmitForm] = useState(false);
  const [submissionText, setSubmissionText] = useState('');
  const [submissionFileUrl, setSubmissionFileUrl] = useState('');
  
  const difficultyColors = {
    easy: 'bg-green-100 text-green-800',
    medium: 'bg-yellow-100 text-yellow-800',
    hard: 'bg-red-100 text-red-800',
    beginner: 'bg-green-100 text-green-800',
    intermediate: 'bg-yellow-100 text-yellow-800',
    advanced: 'bg-orange-100 text-orange-800',
    expert: 'bg-red-100 text-red-800',
  };

  const statusColors = {
    available: 'bg-blue-100 text-blue-800',
    in_progress: 'bg-purple-100 text-purple-800',
    submitted: 'bg-orange-100 text-orange-800',
    completed: 'bg-green-100 text-green-800',
  };
  
  const handleSubmit = async () => {
    if (!submissionText && !submissionFileUrl) {
      alert('Bitte geben Sie Text ein oder eine Datei-URL an');
      return;
    }
    
    try {
      console.log('Submitting quest:', quest.id);
      console.log('Character ID:', characterId);
      console.log('Submission text:', submissionText);
      console.log('File URL:', submissionFileUrl);
      
      const response = await api.post(`/quests/${quest.id}/submit`, {
        characterId: Number(characterId),
        submission_text: submissionText,
        submission_file_url: submissionFileUrl
      });
      
      console.log('Submission response:', response.data);
      alert('Abgabe erfolgreich eingereicht!');
      setShowSubmitForm(false);
      setSubmissionText('');
      setSubmissionFileUrl('');
      onComplete(); // Reload quests
    } catch (error) {
      console.error('Fehler beim Einreichen:', error);
      alert('Fehler beim Einreichen der Abgabe');
    }
  };
  
  const getStatusText = () => {
    if (quest.status === 'in_progress') return 'In Bearbeitung';
    if (quest.status === 'submitted') return 'Eingereicht';
    if (quest.status === 'completed') return 'Abgeschlossen';
    return 'Verfügbar';
  };

  return (
    <div className={`bg-white rounded-lg shadow-md p-6 hover:shadow-xl transition-shadow ${quest.is_locked ? 'opacity-60' : ''}`}>
      {quest.is_locked && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-3 mb-4 flex items-center">
          <span className="text-red-700 text-sm">
            🔒 Benötigt: {quest.required_equipment_name}
          </span>
        </div>
      )}
      
      <div className="flex justify-between items-start mb-4">
        <h3 className="text-xl font-bold text-gray-900">{quest.title}</h3>
        <div className="flex gap-2">
          <span className={`px-3 py-1 rounded-full text-xs font-bold ${difficultyColors[quest.difficulty as keyof typeof difficultyColors]}`}>
            {quest.difficulty}
          </span>
          <span className={`px-3 py-1 rounded-full text-xs font-bold ${statusColors[(quest.status || 'available') as keyof typeof statusColors]}`}>
            {getStatusText()}
          </span>
        </div>
      </div>

      <p className="text-gray-600 mb-4">{quest.description}</p>

      <div className="border-t pt-4 mb-4">
        <div className="text-sm font-bold text-gray-700 mb-2">🎁 Belohnungen:</div>
        <div className="grid grid-cols-2 gap-2 text-sm">
          <div>⭐ {quest.xp_reward} XP</div>
          {quest.programmierung_reward > 0 && <div>💻 +{quest.programmierung_reward} Prog.</div>}
          {quest.netzwerke_reward > 0 && <div>🌐 +{quest.netzwerke_reward} Netzw.</div>}
          {quest.datenbanken_reward > 0 && <div>🗄️ +{quest.datenbanken_reward} DB</div>}
          {quest.hardware_reward > 0 && <div>🖥️ +{quest.hardware_reward} HW</div>}
          {quest.sicherheit_reward > 0 && <div>🔒 +{quest.sicherheit_reward} Sich.</div>}
          {quest.projektmanagement_reward > 0 && <div>📊 +{quest.projektmanagement_reward} PM</div>}
        </div>
      </div>
      
      {quest.status === 'submitted' && quest.grade && (
        <div className="border-t pt-4 mb-4">
          <div className="text-sm font-bold text-gray-700 mb-2">✅ Bewertung:</div>
          <div className="bg-green-50 p-3 rounded-lg">
            <p className="text-sm font-semibold text-green-800 capitalize">{quest.grade}</p>
            {quest.feedback && <p className="text-sm text-gray-600 mt-2">{quest.feedback}</p>}
          </div>
        </div>
      )}
      
      {showSubmitForm && quest.status === 'in_progress' && (
        <div className="border-t pt-4 mb-4">
          <div className="text-sm font-bold text-gray-700 mb-2">📝 Abgabe einreichen:</div>
          <textarea
            placeholder="Beschreiben Sie Ihre Lösung..."
            value={submissionText}
            onChange={(e) => setSubmissionText(e.target.value)}
            rows={4}
            className="w-full border border-gray-300 rounded-lg px-3 py-2 mb-2 text-sm"
          />
          <input
            type="text"
            placeholder="Datei-URL (optional, z.B. GitHub-Link)"
            value={submissionFileUrl}
            onChange={(e) => setSubmissionFileUrl(e.target.value)}
            className="w-full border border-gray-300 rounded-lg px-3 py-2 mb-2 text-sm"
          />
          <div className="flex gap-2">
            <button
              onClick={handleSubmit}
              className="flex-1 bg-green-600 hover:bg-green-700 text-white font-bold py-2 px-4 rounded-lg text-sm"
            >
              Abgabe einreichen
            </button>
            <button
              onClick={() => setShowSubmitForm(false)}
              className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 text-sm"
            >
              Abbrechen
            </button>
          </div>
        </div>
      )}

      <div className="flex gap-3">
        {quest.is_locked ? (
          <div className="flex-1 bg-red-200 text-red-800 font-bold py-2 px-4 rounded-lg text-center cursor-not-allowed">
            🔒 Quest gesperrt
          </div>
        ) : quest.status === 'available' ? (
          <button
            onClick={() => onStart(quest.id)}
            className="flex-1 bg-primary-600 hover:bg-primary-700 text-white font-bold py-2 px-4 rounded-lg transition-colors"
          >
            Quest starten
          </button>
        ) : null}
        {quest.status === 'in_progress' && !showSubmitForm && (
          <button
            onClick={() => setShowSubmitForm(true)}
            className="flex-1 bg-green-600 hover:bg-green-700 text-white font-bold py-2 px-4 rounded-lg transition-colors"
          >
            Lösung einreichen
          </button>
        )}
        {quest.status === 'submitted' && !quest.grade && (
          <div className="flex-1 bg-orange-200 text-orange-800 font-bold py-2 px-4 rounded-lg text-center">
            ⏳ Wartet auf Bewertung
          </div>
        )}
        {quest.status === 'completed' || (quest.status === 'submitted' && quest.grade) && (
          <div className="flex-1 bg-gray-200 text-gray-600 font-bold py-2 px-4 rounded-lg text-center">
            ✓ Abgeschlossen
          </div>
        )}
      </div>
    </div>
  );
}
