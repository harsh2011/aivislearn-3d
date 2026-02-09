import { LessonData } from "../types";

export const generateLesson = async (topic: string, age: number): Promise<LessonData> => {
  try {
    const response = await fetch('/api/generate-lesson', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ topic, age }),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.error || `Server error: ${response.status}`);
    }

    const data = await response.json();
    return data as LessonData;
  } catch (error) {
    console.error("Gemini Generation Error:", error);
    throw error;
  }
};

export interface LessonSummary {
  filename: string;
  topic: string;
  age: number;
  theme: string;
  createdAt: string;
  ageFromFilename?: string;
}

export const fetchGeneratedLessons = async (): Promise<LessonSummary[]> => {
  try {
    const response = await fetch('/api/generated-lessons');
    if (!response.ok) {
      throw new Error(`Failed to fetch lessons: ${response.status}`);
    }
    return await response.json();
  } catch (error) {
    console.error("Fetch Lessons Error:", error);
    return [];
  }
};

export const fetchLesson = async (filename: string): Promise<LessonData> => {
  try {
    const response = await fetch(`/api/generated-lessons/${filename}`);
    if (!response.ok) {
      throw new Error(`Failed to fetch lesson: ${response.status}`);
    }
    return await response.json();
  } catch (error) {
    console.error("Fetch Lesson Error:", error);
    throw error;
  }
};
