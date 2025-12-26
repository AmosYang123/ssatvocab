export interface Word {
  name: string;
  definition: string;
  priority: 1 | 2; // 1: High, 2: Low
  difficulty: 'basic' | 'easy' | 'medium' | 'hard';
}

export type WordStatusType = 'mastered' | 'review' | null;

export type StudyMode = 'all' | 'random' | 'mastered' | 'review' | 'custom' | 'marked' | 'basic' | 'easy' | 'medium' | 'hard';

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