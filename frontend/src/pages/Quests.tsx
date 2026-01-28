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
    } catch (error: any) {
      console.error('Fehler beim Starten der Quest:', error);
      const errorMsg = error.response?.data?.error || 'Fehler beim Starten der Quest';
      const requiredEquipment = error.response?.data?.required_equipment;
      if (requiredEquipment) {
        alert(`Quest kann nicht gestartet werden: Ben\u00f6tigtes Equipment fehlt (${requiredEquipment})`);
      } else {
        alert(errorMsg);
      }
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
            onReload={loadData}
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

function QuestCard({ quest, onStart, onReload }: any) {
  const { characterId } = useParams<{ characterId: string }>();
  const [showSubmitForm, setShowSubmitForm] = useState(false);
  const [submissionText, setSubmissionText] = useState('');
  const [submissionFile, setSubmissionFile] = useState<File | null>(null);
  
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
    failed: 'bg-red-100 text-red-800',
  };
  
  const calculateNextRepeatDate = (): Date | null => {
    if (!quest.is_repeatable || !quest.repeat_interval || !quest.repeat_time) {
      return null;
    }

    // Wenn Quest completed/failed ist, basieren wir auf completed_at
    const baseDate = (quest.status === 'completed' || quest.status === 'failed') && quest.completed_at 
      ? new Date(quest.completed_at)
      : new Date();

    const [hours, minutes] = quest.repeat_time.split(':').map(Number);
    let nextDate = new Date(baseDate);
    nextDate.setHours(hours, minutes, 0, 0);

    if (quest.repeat_interval === 'daily') {
      // Wenn die Quest completed/failed ist, addiere 1 Tag zum completed_at
      if ((quest.status === 'completed' || quest.status === 'failed') && quest.completed_at) {
        nextDate.setDate(nextDate.getDate() + 1);
      } else if (nextDate <= new Date()) {
        nextDate.setDate(nextDate.getDate() + 1);
      }
    } else if (quest.repeat_interval === 'weekly') {
      const targetDay = quest.repeat_day_of_week || 1;
      
      if ((quest.status === 'completed' || quest.status === 'failed') && quest.completed_at) {
        // Nächster Wochentag nach completion
        const currentDay = nextDate.getDay();
        let daysToAdd = targetDay - currentDay;
        if (daysToAdd <= 0) {
          daysToAdd += 7;
        }
        nextDate.setDate(nextDate.getDate() + daysToAdd);
      } else {
        // Nächster Wochentag generell
        const currentDay = nextDate.getDay();
        let daysToAdd = targetDay - currentDay;
        
        if (daysToAdd < 0 || (daysToAdd === 0 && nextDate <= new Date())) {
          daysToAdd += 7;
        }
        nextDate.setDate(nextDate.getDate() + daysToAdd);
      }
    } else if (quest.repeat_interval === 'monthly') {
      const targetDay = quest.repeat_day_of_month || 1;
      
      if ((quest.status === 'completed' || quest.status === 'failed') && quest.completed_at) {
        // Nächster Monat nach completion
        nextDate.setMonth(nextDate.getMonth() + 1);
        const lastDayOfMonth = new Date(nextDate.getFullYear(), nextDate.getMonth() + 1, 0).getDate();
        nextDate.setDate(Math.min(targetDay, lastDayOfMonth));
      } else {
        // Nächster Monat generell
        const currentDay = nextDate.getDate();
        
        if (currentDay > targetDay || (currentDay === targetDay && nextDate <= new Date())) {
          nextDate.setMonth(nextDate.getMonth() + 1);
        }
        
        const lastDayOfMonth = new Date(nextDate.getFullYear(), nextDate.getMonth() + 1, 0).getDate();
        nextDate.setDate(Math.min(targetDay, lastDayOfMonth));
      }
    }

    return nextDate;
  };
  
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setSubmissionFile(e.target.files[0]);
    }
  };
  
  const handleSubmit = async () => {
    if (!submissionText && !submissionFile) {
      alert('Bitte geben Sie Text ein oder laden Sie eine Datei hoch');
      return;
    }
    
    try {
      console.log('Submitting quest:', quest.id);
      console.log('Character ID:', characterId);
      console.log('Submission text:', submissionText);
      console.log('File:', submissionFile);
      
      const formData = new FormData();
      formData.append('characterId', characterId!);
      if (submissionText) {
        formData.append('submission_text', submissionText);
      }
      if (submissionFile) {
        formData.append('file', submissionFile);
      }
      
      const response = await api.post(`/quests/${quest.id}/submit`, formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });
      
      console.log('Submission response:', response.data);
      alert('Abgabe erfolgreich eingereicht!');
      setShowSubmitForm(false);
      setSubmissionText('');
      setSubmissionFile(null);
      onReload(); // Reload quests
    } catch (error: any) {
      console.error('Fehler beim Einreichen:', error);
      const errorMsg = error.response?.data?.error || 'Fehler beim Einreichen der Abgabe';
      alert(errorMsg);
    }
  };
  
  const getStatusText = () => {
    if (quest.status === 'in_progress') return 'In Bearbeitung';
    if (quest.status === 'submitted') return 'Eingereicht';
    if (quest.status === 'completed') return 'Abgeschlossen';
    if (quest.status === 'failed') return 'Nicht bestanden';
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
          {quest.xp_reward > 0 && <div>⭐ {quest.xp_reward} XP</div>}
          {quest.programmierung_reward > 0 && <div>💻 +{quest.programmierung_reward} Prog.</div>}
          {quest.netzwerke_reward > 0 && <div>🌐 +{quest.netzwerke_reward} Netzw.</div>}
          {quest.datenbanken_reward > 0 && <div>🗄️ +{quest.datenbanken_reward} DB</div>}
          {quest.hardware_reward > 0 && <div>🖥️ +{quest.hardware_reward} HW</div>}
          {quest.sicherheit_reward > 0 && <div>🔒 +{quest.sicherheit_reward} Sich.</div>}
          {quest.projektmanagement_reward > 0 && <div>📊 +{quest.projektmanagement_reward} PM</div>}
        </div>
      </div>
      
      {quest.due_date && (
        <div className="border-t pt-4 mb-4">
          <div className="text-sm font-bold text-gray-700 mb-2">📅 Abgabefrist:</div>
          <div className="bg-yellow-50 p-3 rounded-lg">
            <p className="text-sm text-yellow-800 font-semibold">
              {new Date(quest.due_date).toLocaleDateString('de-DE', {
                day: '2-digit',
                month: '2-digit',
                year: 'numeric',
                hour: '2-digit',
                minute: '2-digit'
              })}
            </p>
          </div>
        </div>
      )}
      
      {(quest.is_repeatable && quest.repeat_interval) && (
        <div className="border-t pt-4 mb-4">
          <div className="text-sm font-bold text-gray-700 mb-2">🔄 Wiederholbare Quest</div>
          <div className="bg-blue-50 p-3 rounded-lg">
            <p className="text-sm text-blue-800">
              Wiederholungsintervall: <span className="font-semibold">{String(quest.repeat_interval).toUpperCase()}</span>
            </p>
            {((quest.status === 'completed' || quest.status === 'failed') && calculateNextRepeatDate()) && (
              <p className="text-sm text-blue-800 mt-2">
                ⏰ Nächste Verfügbarkeit: <span className="font-semibold">
                  {calculateNextRepeatDate()!.toLocaleDateString('de-DE', {
                    day: '2-digit',
                    month: '2-digit',
                    year: 'numeric',
                    hour: '2-digit',
                    minute: '2-digit'
                  })}
                </span>
              </p>
            )}
          </div>
        </div>
      )}
      
      {(quest.status === 'failed') && (
        <div className="border-t pt-4 mb-4">
          <div className="text-sm font-bold text-red-700 mb-2">❌ Nicht bestanden</div>
          <div className="bg-red-50 p-3 rounded-lg">
            <p className="text-sm text-red-800">
              Die Abgabefrist wurde überschritten. Diese Quest wurde ohne XP geschlossen.
            </p>
            {quest.is_repeatable ? (
              <p className="text-sm text-red-800 mt-2">
                Du kannst diese Quest beim nächsten Wiederholungszeitpunkt erneut versuchen.
              </p>
            ) : null}
          </div>
        </div>
      )}
      
      {(quest.status === 'submitted' && quest.grade) && (
        <div className="border-t pt-4 mb-4">
          <div className="text-sm font-bold text-gray-700 mb-2">✅ Bewertung:</div>
          <div className="bg-green-50 p-3 rounded-lg">
            <p className="text-sm font-semibold text-green-800 capitalize">{quest.grade}</p>
            {quest.feedback ? <p className="text-sm text-gray-600 mt-2">{quest.feedback}</p> : null}
          </div>
        </div>
      )}
      
      {(showSubmitForm && quest.status === 'in_progress') && (
        <div className="border-t pt-4 mb-4">
          <div className="text-sm font-bold text-gray-700 mb-2">📝 Abgabe einreichen:</div>
          <textarea
            placeholder="Beschreiben Sie Ihre Lösung..."
            value={submissionText}
            onChange={(e) => setSubmissionText(e.target.value)}
            rows={4}
            className="w-full border border-gray-300 rounded-lg px-3 py-2 mb-2 text-sm"
          />
          <div className="mb-2">
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Datei hochladen (optional)
            </label>
            <input
              type="file"
              onChange={handleFileChange}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-sm file:font-semibold file:bg-primary-50 file:text-primary-700 hover:file:bg-primary-100"
              accept=".pdf,.doc,.docx,.xls,.xlsx,.ppt,.pptx,.zip,.rar,.7z,.jpg,.jpeg,.png,.gif,.webp,.txt,.html,.css,.js,.json,.xml,.mp4,.webm"
            />
            {submissionFile ? (
              <p className="text-xs text-gray-600 mt-1">
                Ausgewählt: {submissionFile.name} ({(submissionFile.size / 1024 / 1024).toFixed(2)} MB)
              </p>
            ) : null}
          </div>
          <div className="flex gap-2">
            <button
              onClick={handleSubmit}
              className="flex-1 bg-green-600 hover:bg-green-700 text-white font-bold py-2 px-4 rounded-lg text-sm"
            >
              Abgabe einreichen
            </button>
            <button
              onClick={() => {
                setShowSubmitForm(false);
                setSubmissionText('');
                setSubmissionFile(null);
              }}
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
        {(quest.status === 'in_progress' && !showSubmitForm) && (
          <button
            onClick={() => setShowSubmitForm(true)}
            className="flex-1 bg-green-600 hover:bg-green-700 text-white font-bold py-2 px-4 rounded-lg transition-colors"
          >
            Lösung einreichen
          </button>
        )}
        {(quest.status === 'submitted' && !quest.grade) && (
          <div className="flex-1 bg-orange-200 text-orange-800 font-bold py-2 px-4 rounded-lg text-center">
            ⏳ Wartet auf Bewertung
          </div>
        )}
        {(quest.status === 'completed' || (quest.status === 'submitted' && quest.grade) || quest.status === 'failed') && (
          <>
            {quest.is_repeatable && quest.status !== 'failed' ? (
              <div className="flex-1 bg-blue-200 text-blue-800 font-bold py-2 px-4 rounded-lg text-center">
                🔄 Wiederholbar
              </div>
            ) : quest.status === 'failed' && quest.is_repeatable ? (
              <div className="flex-1 bg-red-200 text-red-800 font-bold py-2 px-4 rounded-lg text-center">
                ❌ Nicht bestanden - Wiederholbar
              </div>
            ) : quest.status === 'failed' ? (
              <div className="flex-1 bg-red-200 text-red-800 font-bold py-2 px-4 rounded-lg text-center">
                ❌ Nicht bestanden
              </div>
            ) : (
              <div className="flex-1 bg-gray-200 text-gray-600 font-bold py-2 px-4 rounded-lg text-center">
                ✓ Abgeschlossen
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
