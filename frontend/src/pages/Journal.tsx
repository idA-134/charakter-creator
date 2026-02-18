import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { journalAPI, characterAPI, questAPI } from '../services/api';
import { JournalEntry, QuestLog, Character, Quest } from '../types';

export default function Journal() {
  const { characterId } = useParams();
  const navigate = useNavigate();
  const [character, setCharacter] = useState<Character | null>(null);
  const [journalEntries, setJournalEntries] = useState<JournalEntry[]>([]);
  const [questLog, setQuestLog] = useState<QuestLog[]>([]);
  const [quests, setQuests] = useState<Quest[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'journal' | 'questlog'>('journal');
  
  // Neuer Eintrag
  const [newEntry, setNewEntry] = useState('');
  const [selectedQuestId, setSelectedQuestId] = useState<number | undefined>();
  const [selectedMood, setSelectedMood] = useState('');
  const [isCreating, setIsCreating] = useState(false);
  
  // Bearbeiten
  const [editingId, setEditingId] = useState<number | null>(null);
  const [editText, setEditText] = useState('');
  const [editMood, setEditMood] = useState('');
  
  // Reflexion
  const [reflectingId, setReflectingId] = useState<number | null>(null);
  const [reflectionText, setReflectionText] = useState('');

  const moodOptions = [
    { value: 'motivated', emoji: '😊', label: 'Motiviert' },
    { value: 'challenged', emoji: '🤔', label: 'Herausgefordert' },
    { value: 'accomplished', emoji: '🎉', label: 'Stolz' },
    { value: 'frustrated', emoji: '😤', label: 'Frustriert' },
    { value: 'confident', emoji: '💪', label: 'Selbstbewusst' },
    { value: 'learning', emoji: '📚', label: 'Überfordert' },
  ];

  useEffect(() => {
    loadData();
  }, [characterId]);

  const loadData = async () => {
    try {
      setLoading(true);
      setError(null);
      console.log(`Loading journal data for character ${characterId}`);
      
      const [charRes, journalRes, questLogRes, questsRes] = await Promise.all([
        characterAPI.getById(Number(characterId)),
        journalAPI.getByCharacter(Number(characterId)),
        journalAPI.getQuestLog(Number(characterId)),
        questAPI.getByCharacter(Number(characterId)),
      ]);
      
      console.log('Character loaded:', charRes.data);
      setCharacter(charRes.data);
      setJournalEntries(journalRes.data || []);
      setQuestLog(questLogRes.data || []);
      setQuests(questsRes.data || []);
    } catch (error: any) {
      const errorMsg = error?.response?.data?.error || error?.message || 'Fehler beim Laden der Daten';
      console.error('Fehler beim Laden der Daten:', errorMsg);
      setError(errorMsg);
      setCharacter(null);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateEntry = async () => {
    if (!newEntry.trim()) return;
    
    try {
      setIsCreating(true);
      await journalAPI.create(Number(characterId), {
        entry_text: newEntry,
        quest_id: selectedQuestId,
        mood: selectedMood || undefined,
      });
      
      setNewEntry('');
      setSelectedQuestId(undefined);
      setSelectedMood('');
      await loadData();
    } catch (error) {
      console.error('Fehler beim Erstellen des Eintrags:', error);
      alert('Fehler beim Erstellen des Eintrags');
    } finally {
      setIsCreating(false);
    }
  };

  const handleEditEntry = async (entryId: number) => {
    if (!editText.trim()) return;
    
    try {
      await journalAPI.update(entryId, {
        entry_text: editText,
        mood: editMood || undefined,
      });
      
      setEditingId(null);
      setEditText('');
      setEditMood('');
      await loadData();
    } catch (error) {
      console.error('Fehler beim Aktualisieren des Eintrags:', error);
      alert('Fehler beim Aktualisieren des Eintrags');
    }
  };

  const handleDeleteEntry = async (entryId: number) => {
    if (!confirm('Möchtest du diesen Eintrag wirklich löschen?')) return;
    
    try {
      await journalAPI.delete(entryId);
      await loadData();
    } catch (error) {
      console.error('Fehler beim Löschen des Eintrags:', error);
      alert('Fehler beim Löschen des Eintrags');
    }
  };

  const startEditing = (entry: JournalEntry) => {
    setEditingId(entry.id);
    setEditText(entry.entry_text);
    setEditMood(entry.mood || '');
  };

  const handleAddReflection = async (logId: number) => {
    if (!reflectionText.trim()) return;
    
    try {
      await journalAPI.addReflection(logId, reflectionText);
      setReflectingId(null);
      setReflectionText('');
      await loadData();
    } catch (error) {
      console.error('Fehler beim Hinzufügen der reflexion:', error);
      alert('Fehler beim Hinzufügen der reflexion');
    }
  };

  const getMoodEmoji = (mood: string | undefined) => {
    const option = moodOptions.find(o => o.value === mood);
    return option ? option.emoji : '';
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('de-DE', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const getGradeBadge = (grade: string | undefined) => {
    if (!grade) return null;
    
    const gradeMap: Record<string, { label: string; className: string }> = {
      approved: { label: 'Angenommen', className: 'bg-green-100 text-green-800' },
      rejected: { label: 'Abgelehnt', className: 'bg-red-100 text-red-800' },
      excellent: { label: 'Ausgezeichnet', className: 'bg-purple-100 text-purple-800' },
      good: { label: 'Gut', className: 'bg-blue-100 text-blue-800' },
      satisfactory: { label: 'Befriedigend', className: 'bg-yellow-100 text-yellow-800' },
      sufficient: { label: 'Ausreichend', className: 'bg-orange-100 text-orange-800' },
      insufficient: { label: 'Unzureichend', className: 'bg-red-100 text-red-800' },
    };
    
    const info = gradeMap[grade] || { label: grade, className: 'bg-gray-100 text-gray-800' };
    return (
      <span className={`px-2 py-1 text-xs rounded ${info.className}`}>
        {info.label}
      </span>
    );
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <div className="text-xl">Lade Tagebuch...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <div className="text-center">
          <div className="text-xl text-red-600 mb-4">⚠️ Fehler beim Laden</div>
          <div className="text-gray-600 mb-6">{error}</div>
          <button
            onClick={() => loadData()}
            className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-6 rounded-lg"
          >
            Erneut versuchen
          </button>
        </div>
      </div>
    );
  }

  if (!character) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <div className="text-xl text-red-600">Charakter nicht gefunden</div>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto px-4 py-8">
      {/* Header */}
      <div className="bg-white rounded-lg shadow-md p-6 mb-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">
              📖 {character.name}s Tagebuch
            </h1>
            <p className="text-gray-600 mt-1">
              Dokumentiere deine Erfahrungen und Lernfortschritte
            </p>
          </div>
          <button
            onClick={() => navigate(`/character/${characterId}`)}
            className="px-4 py-2 bg-gray-200 hover:bg-gray-300 rounded-lg transition-colors"
          >
            Zurück zum Profil
          </button>
        </div>
      </div>

      {/* Tabs */}
      <div className="bg-white rounded-lg shadow-md mb-6">
        <div className="flex border-b">
          <button
            onClick={() => setActiveTab('journal')}
            className={`flex-1 py-4 px-6 font-semibold transition-colors ${
              activeTab === 'journal'
                ? 'text-primary-600 border-b-2 border-primary-600'
                : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            📝 Tagebuch ({journalEntries.length})
          </button>
          <button
            onClick={() => setActiveTab('questlog')}
            className={`flex-1 py-4 px-6 font-semibold transition-colors ${
              activeTab === 'questlog'
                ? 'text-primary-600 border-b-2 border-primary-600'
                : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            ✅ Quest-Log ({questLog.length})
          </button>
        </div>
      </div>

      {/* Journal Tab */}
      {activeTab === 'journal' && (
        <div className="space-y-6">
          {/* Neuer Eintrag */}
          <div className="bg-white rounded-lg shadow-md p-6">
            <h2 className="text-xl font-bold text-gray-900 mb-4">
              ✏️ Neuer Eintrag
            </h2>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Was möchtest du festhalten?
                </label>
                <textarea
                  value={newEntry}
                  onChange={(e) => setNewEntry(e.target.value)}
                  placeholder="Beschreibe deine Erfahrungen, Learnings oder Gedanken..."
                  rows={4}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Quest (optional)
                  </label>
                  <select
                    value={selectedQuestId || ''}
                    onChange={(e) => setSelectedQuestId(e.target.value ? Number(e.target.value) : undefined)}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                  >
                    <option value="">Keine Quest</option>
                    {quests.filter(q => q.status === 'in_progress' || q.status === 'completed').map(quest => (
                      <option key={quest.id} value={quest.id}>
                        {quest.title}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    mood (optional)
                  </label>
                  <select
                    value={selectedMood}
                    onChange={(e) => setSelectedMood(e.target.value)}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                  >
                    <option value="">- auswählen -</option>
                    {moodOptions.map(mood => (
                      <option key={mood.value} value={mood.value}>
                        {mood.emoji} {mood.label}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <button
                onClick={handleCreateEntry}
                disabled={!newEntry.trim() || isCreating}
                className="w-full bg-primary-600 hover:bg-primary-700 disabled:bg-gray-300 text-white font-bold py-3 px-4 rounded-lg transition-colors"
              >
                {isCreating ? 'Speichere...' : 'Eintrag erstellen'}
              </button>
            </div>
          </div>

          {/* Einträge Liste */}
          <div className="space-y-4">
            {journalEntries.length === 0 ? (
              <div className="bg-white rounded-lg shadow-md p-8 text-center">
                <p className="text-gray-500">
                  Noch keine Einträge vorhanden. Erstelle deinen ersten Tagebuch-Eintrag!
                </p>
              </div>
            ) : (
              journalEntries.map(entry => (
                <div key={entry.id} className="bg-white rounded-lg shadow-md p-6">
                  {editingId === entry.id ? (
                    // Bearbeitungsmodus
                    <div className="space-y-4">
                      <textarea
                        value={editText}
                        onChange={(e) => setEditText(e.target.value)}
                        rows={4}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
                      />
                      <select
                        value={editMood}
                        onChange={(e) => setEditMood(e.target.value)}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg"
                      >
                        <option value="">Kein mood</option>
                        {moodOptions.map(mood => (
                          <option key={mood.value} value={mood.value}>
                            {mood.emoji} {mood.label}
                          </option>
                        ))}
                      </select>
                      <div className="flex gap-2">
                        <button
                          onClick={() => handleEditEntry(entry.id)}
                          className="flex-1 bg-primary-600 hover:bg-primary-700 text-white font-bold py-2 px-4 rounded-lg"
                        >
                          Speichern
                        </button>
                        <button
                          onClick={() => {
                            setEditingId(null);
                            setEditText('');
                            setEditMood('');
                          }}
                          className="flex-1 bg-gray-200 hover:bg-gray-300 text-gray-700 font-bold py-2 px-4 rounded-lg"
                        >
                          Abbrechen
                        </button>
                      </div>
                    </div>
                  ) : (
                    // Ansichtsmodus
                    <>
                      <div className="flex items-start justify-between mb-3">
                        <div className="flex items-center gap-3">
                          <span className="text-sm text-gray-500">
                            {formatDate(entry.entry_date)}
                          </span>
                          {entry.mood && (
                            <span className="text-2xl" title={entry.mood}>
                              {getMoodEmoji(entry.mood)}
                            </span>
                          )}
                        </div>
                        <div className="flex gap-2">
                          <button
                            onClick={() => startEditing(entry)}
                            className="text-blue-600 hover:text-blue-800 text-sm"
                          >
                            Bearbeiten
                          </button>
                          <button
                            onClick={() => handleDeleteEntry(entry.id)}
                            className="text-red-600 hover:text-red-800 text-sm"
                          >
                            Löschen
                          </button>
                        </div>
                      </div>

                      {entry.quest_id && (
                        <div className="mb-2">
                          <span className="inline-block px-3 py-1 bg-primary-100 text-primary-800 text-sm rounded-full">
                            📋 {entry.quest_title}
                          </span>
                        </div>
                      )}

                      <p className="text-gray-700 whitespace-pre-wrap">{entry.entry_text}</p>
                    </>
                  )}
                </div>
              ))
            )}
          </div>
        </div>
      )}

      {/* Quest-Log Tab */}
      {activeTab === 'questlog' && (
        <div className="space-y-4">
          {questLog.length === 0 ? (
            <div className="bg-white rounded-lg shadow-md p-8 text-center">
              <p className="text-gray-500">
                Noch keine abgeschlossenen Quests. Schließe deine erste Quest ab!
              </p>
            </div>
          ) : (
            questLog.map(log => (
              <div key={log.id} className="bg-white rounded-lg shadow-md p-6">
                <div className="flex items-start justify-between mb-3">
                  <div>
                    <h3 className="text-xl font-bold text-gray-900">{log.quest_title}</h3>
                    <p className="text-sm text-gray-500">
                      Abgeschlossen am {formatDate(log.completed_at)}
                    </p>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="px-3 py-1 bg-yellow-100 text-yellow-800 text-sm rounded-full">
                      +{log.xp_earned} XP
                    </span>
                    {getGradeBadge(log.grade)}
                  </div>
                </div>

                {log.quest_description && (
                  <p className="text-gray-600 mb-3 text-sm">{log.quest_description}</p>
                )}

                {log.feedback && (
                  <div className="bg-blue-50 border-l-4 border-blue-500 p-4 mb-3">
                    <p className="text-sm font-semibold text-blue-900 mb-1">Feedback:</p>
                    <p className="text-sm text-blue-800">{log.feedback}</p>
                  </div>
                )}

                {reflectingId === log.id ? (
                  <div className="mt-4 space-y-2">
                    <textarea
                      value={reflectionText}
                      onChange={(e) => setReflectionText(e.target.value)}
                      placeholder="Was hast du aus dieser Quest gelernt? Welche Erkenntnisse nimmst du mit?"
                      rows={3}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
                    />
                    <div className="flex gap-2">
                      <button
                        onClick={() => handleAddReflection(log.id)}
                        className="flex-1 bg-primary-600 hover:bg-primary-700 text-white font-bold py-2 px-4 rounded-lg"
                      >
                        Speichern
                      </button>
                      <button
                        onClick={() => {
                          setReflectingId(null);
                          setReflectionText('');
                        }}
                        className="flex-1 bg-gray-200 hover:bg-gray-300 text-gray-700 font-bold py-2 px-4 rounded-lg"
                      >
                        Abbrechen
                      </button>
                    </div>
                  </div>
                ) : log.reflection ? (
                  <div className="mt-4 bg-green-50 border-l-4 border-green-500 p-4">
                    <p className="text-sm font-semibold text-green-900 mb-1">Meine reflexion:</p>
                    <p className="text-sm text-green-800">{log.reflection}</p>
                    <button
                      onClick={() => {
                        setReflectingId(log.id);
                        setReflectionText(log.reflection || '');
                      }}
                      className="mt-2 text-sm text-green-700 hover:text-green-900"
                    >
                      Bearbeiten
                    </button>
                  </div>
                ) : (
                  <button
                    onClick={() => setReflectingId(log.id)}
                    className="mt-4 text-primary-600 hover:text-primary-800 text-sm font-semibold"
                  >
                    + reflexion hinzufügen
                  </button>
                )}
              </div>
            ))
          )}
        </div>
      )}
    </div>
  );
}
