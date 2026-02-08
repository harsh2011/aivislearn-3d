export type SceneTheme = 'sky' | 'space' | 'forest' | 'sunset' | 'city';

export interface SceneObjectState {
  id: string;
  shape: 'box' | 'sphere' | 'cylinder' | 'cone' | 'torus' | 'icosahedron';
  color: string;
  position: [number, number, number];
  rotation: [number, number, number];
  scale: [number, number, number];
  opacity: number; // 0 = invisible/hidden
  label?: string;
}

export interface ObjectUpdate {
  id: string;
  updates: Partial<Omit<SceneObjectState, 'id'>>;
}

export interface LessonStep {
  stepId: string;
  explanation: string; // The text to show for this step
  objectUpdates: ObjectUpdate[]; 
}

export interface QuizQuestion {
  question: string;
  options: string[];
  correctAnswerIndex: number;
  explanation: string; // Shown after answering
}

export interface LessonData {
  topic: string;
  theme: SceneTheme;
  initialObjects: SceneObjectState[];
  steps: LessonStep[];
  quiz: QuizQuestion[];
}

export type AppState = 'HOME' | 'GENERATING' | 'EXPLAINING' | 'QUIZ' | 'SUMMARY';
