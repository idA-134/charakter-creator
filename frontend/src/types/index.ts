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
  
  created_at: string;
  updated_at: string;
}

export interface Equipment {
  id: number;
  name: string;
  description: string;
  type: 'laptop' | 'software' | 'tool' | 'certification';
  rarity: 'common' | 'uncommon' | 'rare' | 'epic' | 'legendary';
  
  programmierung_bonus: number;
  netzwerke_bonus: number;
  datenbanken_bonus: number;
  hardware_bonus: number;
  sicherheit_bonus: number;
  projektmanagement_bonus: number;
  
  min_level: number;
  equipped?: boolean;
  acquired_at?: string;
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
  unlocked?: boolean;
  unlocked_at?: string;
}

export interface Quest {
  id: number;
  title: string;
  description: string;
  category: string;
  difficulty: 'easy' | 'medium' | 'hard';
  xp_reward: number;
  
  programmierung_reward: number;
  netzwerke_reward: number;
  datenbanken_reward: number;
  hardware_reward: number;
  sicherheit_reward: number;
  projektmanagement_reward: number;
  
  is_title_quest?: boolean;
  title_reward?: string;
  equipment_reward_id?: number;
  
  min_level: number;
  prerequisite_quest_id?: number;
  created_by_user_id?: number;
  
  status?: 'available' | 'in_progress' | 'submitted' | 'completed';
  started_at?: string;
  completed_at?: string;
  submitted_at?: string;
  submission_text?: string;
  submission_file_url?: string;
  grade?: 'excellent' | 'good' | 'satisfactory' | 'sufficient' | 'insufficient';
  feedback?: string;
  
  // Wiederholbarkeit
  is_repeatable?: boolean;
  repeat_interval?: 'daily' | 'weekly' | 'monthly';
  repeat_time?: string;
  repeat_day_of_week?: number;
  repeat_day_of_month?: number;
  due_date?: string;
  xp_scaling?: 'fixed' | 'scaled';
}

export interface User {
  id: number;
  username: string;
  role?: 'nachwuchskraft' | 'dozent' | 'admin';
  isAdmin?: boolean;
  isSuperAdmin?: boolean;
}

export interface Group {
  id: number;
  name: string;
  description?: string;
  created_by_user_id: number;
  created_by_username?: string;
  member_count?: number;
  members?: GroupMember[];
  created_at: string;
}

export interface GroupMember {
  id: number;
  username: string;
  character_id?: number;
  character_name?: string;
  level?: number;
  joined_at: string;
}

export interface LeaderboardEntry {
  id: number;
  name: string;
  title: string;
  level: number;
  username: string;
  xp?: number;
  total_stats?: number;
  achievement_count?: number;
  completed_quests?: number;
}
