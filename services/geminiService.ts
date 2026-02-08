import { LessonData } from "../types";

export const generateLesson = async (topic: string, age: number): Promise<LessonData> => {
  try {
    const response = await fetch('http://localhost:3001/api/generate-lesson', {
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
