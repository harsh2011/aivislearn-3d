import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { GoogleGenAI, Type } from '@google/genai';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

// Load environment variables
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// On Vercel, .env is automatically loaded, but we can also load .env.local if present locally
dotenv.config();

const app = express();

app.use(cors());
app.use(express.json());

// Prepare directory for local file saving (only works in /tmp or locally)
const generatedLessonsDir = process.env.VERCEL ? '/tmp/generated_lessons' : path.join(__dirname, 'generated_lessons');
if (!fs.existsSync(generatedLessonsDir)) {
    fs.mkdirSync(generatedLessonsDir, { recursive: true });
}

// Initialize Gemini
const apiKey = process.env.GEMINI_API_KEY || process.env.API_KEY;

// Note: On Vercel, if API key is missing at runtime, the request will fail. 
// We don't exit the process here to allow other routes or environments to work.

app.post('/api/generate-lesson', async (req, res) => {
    try {
        if (!apiKey) {
            throw new Error("Missing GEMINI_API_KEY. Please set it in Vercel environment variables.");
        }

        const { topic, age } = req.body;

        if (!topic || !age) {
            return res.status(400).json({ error: 'Topic and age are required' });
        }

        console.log(`Generating lesson for topic: "${topic}", age: ${age}`);

        const ai = new GoogleGenAI({ apiKey });
        const model = "gemini-2.0-flash";

        let complexityInstructions = "";
        if (age <= 5) {
            complexityInstructions = "Target Age 3-5 (Toddler/Preschool): Use very simple language, short sentences. Use primary colors. Visuals should be big and simple. Keep steps few (3-4 max). Quiz should be very easy matching.";
        } else if (age <= 8) {
            complexityInstructions = "Target Age 6-8 (Early Elementary): Use simple but complete sentences. Visuals can have some detail. Steps can be 4-6. Quiz can ask about facts.";
        } else {
            complexityInstructions = "Target Age 9-12 (Late Elementary/Pre-teen): Use richer vocabulary. Visuals can represent more complex abstract concepts. Steps can be 5-8. Quiz should test understanding of concepts.";
        }

        const prompt = `
            Create an interactive 3D visual lesson about: "${topic}".
            
            ${complexityInstructions}

            Structure:
            1. Define a set of 3D objects (shapes) that will be actors in the lesson.
            2. Create a series of "steps" to explain the topic.
            - In each step, provide an explanation text.
            - In each step, you can move, rotate, scale, color, show, or hide the objects to visualize the concept.
            3. Create a short quiz (3 questions) based on the lesson.

            Guidelines for 3D Objects:
            - Use simple shapes: 'box', 'sphere', 'cylinder', 'cone', 'torus', 'icosahedron'.
            - Position range: x: -5 to 5, y: -2 to 5, z: -5 to 5.
            - To hide an object initially, set opacity to 0. To show it later, update opacity to 1.
            - Use "objectUpdates" in steps to animate changes. For example, to show addition, move two objects closer together. To show the solar system, rotate planets around a sun.

            Output strict JSON matching the schema.
        `;

        const response = await ai.models.generateContent({
            model,
            contents: prompt,
            config: {
                responseMimeType: "application/json",
                responseSchema: {
                    type: Type.OBJECT,
                    properties: {
                        topic: { type: Type.STRING },
                        theme: { type: Type.STRING, enum: ['sky', 'space', 'forest', 'sunset', 'city'] },
                        initialObjects: {
                            type: Type.ARRAY,
                            items: {
                                type: Type.OBJECT,
                                properties: {
                                    id: { type: Type.STRING },
                                    shape: { type: Type.STRING, enum: ['box', 'sphere', 'cylinder', 'cone', 'torus', 'icosahedron'] },
                                    color: { type: Type.STRING },
                                    position: { type: Type.ARRAY, items: { type: Type.NUMBER } },
                                    rotation: { type: Type.ARRAY, items: { type: Type.NUMBER } },
                                    scale: { type: Type.ARRAY, items: { type: Type.NUMBER } },
                                    opacity: { type: Type.NUMBER },
                                    label: { type: Type.STRING, nullable: true },
                                },
                                required: ['id', 'shape', 'color', 'position', 'rotation', 'scale', 'opacity'],
                            },
                        },
                        steps: {
                            type: Type.ARRAY,
                            items: {
                                type: Type.OBJECT,
                                properties: {
                                    stepId: { type: Type.STRING },
                                    explanation: { type: Type.STRING },
                                    objectUpdates: {
                                        type: Type.ARRAY,
                                        items: {
                                            type: Type.OBJECT,
                                            properties: {
                                                id: { type: Type.STRING },
                                                updates: {
                                                    type: Type.OBJECT,
                                                    properties: {
                                                        shape: { type: Type.STRING, enum: ['box', 'sphere', 'cylinder', 'cone', 'torus', 'icosahedron'], nullable: true },
                                                        color: { type: Type.STRING, nullable: true },
                                                        position: { type: Type.ARRAY, items: { type: Type.NUMBER }, nullable: true },
                                                        rotation: { type: Type.ARRAY, items: { type: Type.NUMBER }, nullable: true },
                                                        scale: { type: Type.ARRAY, items: { type: Type.NUMBER }, nullable: true },
                                                        opacity: { type: Type.NUMBER, nullable: true },
                                                        label: { type: Type.STRING, nullable: true },
                                                    },
                                                }
                                            },
                                            required: ['id', 'updates'],
                                        },
                                    },
                                },
                                required: ['stepId', 'explanation', 'objectUpdates'],
                            },
                        },
                        quiz: {
                            type: Type.ARRAY,
                            items: {
                                type: Type.OBJECT,
                                properties: {
                                    question: { type: Type.STRING },
                                    options: { type: Type.ARRAY, items: { type: Type.STRING } },
                                    correctAnswerIndex: { type: Type.INTEGER },
                                    explanation: { type: Type.STRING },
                                },
                                required: ['question', 'options', 'correctAnswerIndex', 'explanation'],
                            },
                        },
                    },
                    required: ['topic', 'theme', 'initialObjects', 'steps', 'quiz'],
                },
            },
        });

        if (response.text) {
            let text = response.text;
            if (typeof text === 'function') { text = text(); }
            const lessonData = JSON.parse(text);

            // Save to file (best effort - will only work locally or temporarily on Vercel)
            try {
                const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
                const sanitizedTopic = topic.replace(/[^a-z0-9]/gi, '_').toLowerCase();
                const filename = `lesson_${sanitizedTopic}_${age}_${timestamp}.json`;
                const filePath = path.join(generatedLessonsDir, filename);
                fs.writeFileSync(filePath, JSON.stringify(lessonData, null, 2));
                console.log(`Saved lesson to ${filePath}`);
            } catch (fsErr) {
                console.warn("Could not save lesson to file:", fsErr.message);
            }

            res.json(lessonData);
        } else {
            throw new Error("No response text from Gemini");
        }

    } catch (error) {
        console.error("Server Generation Error:", error);
        res.status(500).json({ error: error.message || "Failed to generate lesson" });
    }
});

// Local execution support
if (!process.env.VERCEL && process.env.NODE_ENV !== 'production') {
    const port = 3001;
    app.listen(port, () => {
        console.log(`Server running locally at http://localhost:${port}`);
    });
}

// Export the app for Vercel
export default app;
