export interface Word {
  name: string;
  definition: string;
  priority: 1 | 2; // 1: High, 2: Low
  difficulty: 'basic' | 'easy' | 'medium' | 'hard';
  version?: 'old' | 'new';
}

export type WordStatusType = 'mastered' | 'review' | null;

export type StudyMode = 'all' | 'random' | 'mastered' | 'review' | 'custom' | 'marked' |
  'basic' | 'easy' | 'medium' | 'hard' |
  'new_all' | 'new_basic' | 'new_easy' | 'new_medium' | 'new_hard' |
  'new_mastered' | 'new_review' | 'new_new' |
  'old_all' | 'old_basic' | 'old_easy' | 'old_medium' | 'old_hard' |
  'old_mastered' | 'old_review' | 'old_new';

export type TestType = 'multiple-choice' | 'type-in';

export interface TestAnswer {
  questionIndex: number;
  userAnswer: string;
}

export interface WordStatusMap {
  [wordName: string]: WordStatusType;
}

export interface MarkedWordsMap {
  [wordName: string]: boolean;
}

export interface StudySet {
  id: string;
  name: string;
  wordNames: string[];
}

export type ThemeMode = 'light' | 'dark' | 'system';

export interface UserPreferences {
  theme: ThemeMode;
}