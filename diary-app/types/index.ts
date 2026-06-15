export interface Profile {
  id: string
  email: string
  group_code: string
  is_owner: boolean
  status: 'pending' | 'approved'
  created_at: string
}

export interface DiaryEntry {
  id: string
  user_id: string
  title: string
  content: string
  mood: string | null
  date: string
  is_public: boolean
  created_at: string
  updated_at: string
}

export interface Comment {
  id: string
  entry_id: string
  user_id: string
  content: string
  created_at: string
}

export interface ChatMessage {
  role: 'user' | 'assistant'
  content: string
}

export interface ChatSession {
  id: string
  diary_entry_id: string | null
  user_id: string
  messages: ChatMessage[]
  created_at: string
  updated_at: string
}

export type Mood = 'great' | 'good' | 'neutral' | 'bad' | 'terrible'

export const MOOD_LABELS: Record<Mood, string> = {
  great: '最高',
  good: '良い',
  neutral: '普通',
  bad: '悪い',
  terrible: '最悪',
}

export const MOOD_EMOJI: Record<Mood, string> = {
  great: '😄',
  good: '🙂',
  neutral: '😐',
  bad: '😕',
  terrible: '😢',
}
