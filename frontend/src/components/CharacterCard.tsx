import { Character } from '../types';

interface Props {
  character: Character;
}

export default function CharacterCard({ character }: Props) {
  const xpPercentage = (character.xp / character.xp_to_next_level) * 100;
  
  const totalStats = 
    character.programmierung +
    character.netzwerke +
    character.datenbanken +
    character.hardware +
    character.sicherheit +
    character.projektmanagement;

  return (
    <div className="bg-white rounded-lg shadow-md p-6 hover:shadow-xl transition-shadow">
      <div className="flex justify-between items-start mb-4">
        <div>
          <h3 className="text-2xl font-bold text-gray-900">{character.name}</h3>
          <p className="text-gray-600">{character.title}</p>
        </div>
        <div className="text-right">
          <div className="text-3xl font-bold text-primary-600">Level {character.level}</div>
        </div>
      </div>

      {/* XP Bar */}
      <div className="mb-4">
        <div className="flex justify-between text-sm text-gray-600 mb-1">
          <span>XP</span>
          <span>{character.xp} / {character.xp_to_next_level}</span>
        </div>
        <div className="w-full bg-gray-200 rounded-full h-3">
          <div 
            className="bg-primary-500 h-3 rounded-full transition-all"
            style={{ width: `${xpPercentage}%` }}
          />
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 gap-3 mb-4">
        <StatBar label="Programmierung" value={character.programmierung} icon="💻" />
        <StatBar label="Netzwerke" value={character.netzwerke} icon="🌐" />
        <StatBar label="Datenbanken" value={character.datenbanken} icon="🗄️" />
        <StatBar label="Hardware" value={character.hardware} icon="🖥️" />
        <StatBar label="Sicherheit" value={character.sicherheit} icon="🔒" />
        <StatBar label="Projekt-Mgmt" value={character.projektmanagement} icon="📊" />
      </div>

      <div className="border-t pt-3 flex justify-between items-center">
        <span className="text-sm text-gray-500">
          Gesamt-Stats: <span className="font-bold text-gray-700">{totalStats}</span>
        </span>
      </div>
    </div>
  );
}

function StatBar({ label, value, icon }: { label: string; value: number; icon: string }) {
  return (
    <div>
      <div className="flex items-center justify-between text-xs text-gray-600 mb-1">
        <span>{icon} {label}</span>
        <span className="font-bold">{value}</span>
      </div>
      <div className="w-full bg-gray-200 rounded-full h-2">
        <div 
          className="bg-green-500 h-2 rounded-full transition-all"
          style={{ width: `${value}%` }}
        />
      </div>
    </div>
  );
}
