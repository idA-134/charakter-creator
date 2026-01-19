import { useEffect, useState } from 'react';
import { api } from '../services/api';

export default function SubmissionReview() {
  const [submissions, setSubmissions] = useState<any[]>([]);
  const [selectedSubmission, setSelectedSubmission] = useState<any>(null);
  const [grade, setGrade] = useState('');
  const [feedback, setFeedback] = useState('');
  const user = JSON.parse(localStorage.getItem('user') || '{}');

  useEffect(() => {
    loadSubmissions();
  }, []);

  const loadSubmissions = async () => {
    try {
      console.log('Loading submissions for user:', user.id);
      const questsRes = await api.get(`/dozent/quests/my/${user.id}`);
      console.log('Dozent quests:', questsRes.data);
      
      const allSubmissions = [];
      
      for (const quest of questsRes.data) {
        console.log(`Loading submissions for quest ${quest.id}:`, quest.title);
        const subRes = await api.get(`/dozent/quests/${quest.id}/submissions`);
        console.log(`Submissions for quest ${quest.id}:`, subRes.data);
        allSubmissions.push(...subRes.data.map((s: any) => ({ ...s, quest_title: quest.title })));
      }
      
      console.log('All submissions:', allSubmissions);
      const ungraded = allSubmissions.filter(s => !s.grade);
      console.log('Ungraded submissions:', ungraded);
      setSubmissions(ungraded);
    } catch (error) {
      console.error('Fehler beim Laden der Abgaben:', error);
    }
  };

  const handleGrade = async () => {
    if (!grade) {
      alert('Bitte wählen Sie ob die Aufgabe erfüllt wurde oder abgelehnt wird');
      return;
    }
    
    if (grade === 'rejected' && !feedback) {
      alert('Bei Ablehnung ist eine Begründung erforderlich');
      return;
    }
    
    try {
      await api.post(`/dozent/submissions/${selectedSubmission.id}/grade`, {
        grade,
        feedback,
        graded_by_user_id: user.id
      });
      
      alert(grade === 'approved' ? 'Abgabe angenommen!' : 'Abgabe abgelehnt');
      setSelectedSubmission(null);
      setGrade('');
      setFeedback('');
      loadSubmissions();
    } catch (error) {
      console.error('Fehler beim Bewerten:', error);
      alert('Fehler beim Bewerten der Abgabe');
    }
  };

  return (
    <div className="max-w-7xl mx-auto p-8">
      <h1 className="text-3xl font-bold text-gray-900 mb-8">Abgaben bewerten</h1>
      
      {!selectedSubmission ? (
        <div className="bg-white shadow-md rounded-lg overflow-hidden">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Quest</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Character</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">User</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Eingereicht am</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Aktion</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {submissions.map((sub) => (
                <tr key={sub.id}>
                  <td className="px-6 py-4 text-sm font-medium text-gray-900">{sub.quest_title}</td>
                  <td className="px-6 py-4 text-sm text-gray-500">{sub.character_name} (Lv. {sub.level})</td>
                  <td className="px-6 py-4 text-sm text-gray-500">{sub.username}</td>
                  <td className="px-6 py-4 text-sm text-gray-500">
                    {new Date(sub.submitted_at).toLocaleString('de-DE')}
                  </td>
                  <td className="px-6 py-4 text-sm">
                    <button
                      onClick={() => setSelectedSubmission(sub)}
                      className="text-blue-600 hover:text-blue-900 font-medium"
                    >
                      Bewerten
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          
          {submissions.length === 0 && (
            <div className="text-center py-12 text-gray-500">
              Keine unbewerteten Abgaben vorhanden
            </div>
          )}
        </div>
      ) : (
        <div className="bg-white shadow-md rounded-lg p-6">
          <div className="mb-6">
            <h2 className="text-2xl font-bold text-gray-900 mb-2">{selectedSubmission.quest_title}</h2>
            <p className="text-gray-600">
              Von: {selectedSubmission.username} ({selectedSubmission.character_name})
            </p>
            <p className="text-sm text-gray-500">
              Eingereicht am: {new Date(selectedSubmission.submitted_at).toLocaleString('de-DE')}
            </p>
          </div>
          
          <div className="mb-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-2">Abgabe</h3>
            <div className="bg-gray-50 p-4 rounded-lg">
              {selectedSubmission.submission_text && (
                <div className="mb-4">
                  <p className="text-sm font-medium text-gray-700 mb-2">Text:</p>
                  <p className="text-gray-900 whitespace-pre-wrap">{selectedSubmission.submission_text}</p>
                </div>
              )}
              {selectedSubmission.submission_file_url && (
                <div>
                  <p className="text-sm font-medium text-gray-700 mb-2">Datei:</p>
                  <a
                    href={selectedSubmission.submission_file_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-blue-600 hover:underline"
                  >
                    {selectedSubmission.submission_file_url}
                  </a>
                </div>
              )}
            </div>
          </div>
          
          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-700 mb-2">Bewertung *</label>
            <select
              value={grade}
              onChange={(e) => setGrade(e.target.value)}
              className="w-full border border-gray-300 rounded-lg px-4 py-2"
            >
              <option value="">-- Bitte wählen --</option>
              <option value="approved">✅ Aufgabe erfüllt (Punkte gutschreiben)</option>
              <option value="rejected">❌ Abgelehnt (mit Begründung)</option>
            </select>
          </div>
          
          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Feedback {grade === 'rejected' && <span className="text-red-600">*</span>}
            </label>
            <textarea
              value={feedback}
              onChange={(e) => setFeedback(e.target.value)}
              rows={4}
              placeholder={grade === 'rejected' ? 'Begründung für die Ablehnung (erforderlich)...' : 'Geben Sie hier Ihr Feedback zur Abgabe (optional)...'}
              className="w-full border border-gray-300 rounded-lg px-4 py-2"
            />
          </div>
          
          <div className="flex space-x-4">
            <button
              onClick={handleGrade}
              className="flex-1 bg-green-600 hover:bg-green-700 text-white font-bold py-3 px-6 rounded-lg transition-colors"
            >
              Bewertung speichern
            </button>
            <button
              onClick={() => {
                setSelectedSubmission(null);
                setGrade('');
                setFeedback('');
              }}
              className="px-6 py-3 border border-gray-300 rounded-lg hover:bg-gray-50"
            >
              Abbrechen
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
