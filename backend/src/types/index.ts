export interface Character {
  id: number;
  user_id: number;
  name: string;
  title: string;
  level: number;
  xp: number;
  xp_to_next_level: number;
  
  // Attribute
  programmierung: number;
  netzwerke: number;
  datenbanken: number;
  hardware: number;
  sicherheit: number;
  projektmanagement: number;
  
  created_at: Date;
  updated_at: Date;
}

export interface Equipment {
  id: number;
  name: string;
  description: string;
  type: 'laptop' | 'software' | 'tool' | 'certification';
  rarity: 'common' | 'uncommon' | 'rare' | 'epic' | 'legendary';
  
  // Boni
  programmierung_bonus: number;
  netzwerke_bonus: number;
  datenbanken_bonus: number;
  hardware_bonus: number;
  sicherheit_bonus: number;
  projektmanagement_bonus: number;
  
  min_level: number;
  created_at: Date;
}

export interface Achievement {
  id: number;
  name: string;
  description: string;
  icon: string;
  category: string;
  xp_reward: number;
  requirement_type: string;
  requirement_value: number;
  created_at: Date;
}

export interface Quest {
  id: number;
  title: string;
  description: string;
  category: string;
  difficulty: 'easy' | 'medium' | 'hard';
  xp_reward: number;
  
  // Belohnungen
  programmierung_reward: number;
  netzwerke_reward: number;
  datenbanken_reward: number;
  hardware_reward: number;
  sicherheit_reward: number;
  projektmanagement_reward: number;
  
  // Erweiterte Quest-Features
  is_title_quest: boolean;
  title_reward?: string;
  equipment_reward_id?: number;
  
  min_level: number;
  prerequisite_quest_id?: number;
  created_by_user_id?: number;
  created_at: Date;
}

export interface CharacterQuest {
  id: number;
  character_id: number;
  quest_id: number;
  status: 'available' | 'in_progress' | 'submitted' | 'completed';
  started_at?: Date;
  completed_at?: Date;
  submission_text?: string;
  submission_file_url?: string;
  submitted_at?: Date;
  grade?: 'excellent' | 'good' | 'satisfactory' | 'sufficient' | 'insufficient';
  feedback?: string;
  graded_at?: Date;
  graded_by_user_id?: number;
}

export interface User {
  id: number;
  username: string;
  password_hash: string;
  role: 'nachwuchskraft' | 'dozent' | 'admin';
  is_admin: boolean;
  is_super_admin: boolean;
  created_at: Date;
}

export interface Group {
  id: number;
  name: string;
  description?: string;
  created_by_user_id: number;
  created_at: Date;
}

export interface GroupMember {
  id: number;
  group_id: number;
  user_id: number;
  joined_at: Date;
}

export interface QuestAssignment {
  id: number;
  quest_id: number;
  user_id?: number;
  group_id?: number;
  assigned_at: Date;
}
