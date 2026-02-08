import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { GoogleGenAI, Type } from '@google/genai';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

// Load environment variables from specific path
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Try to load from root .env.local
dotenv.config({ path: path.join(__dirname, '../.env.local') });

const app = express();
const port = 3001;

app.use(cors());
app.use(express.json());

// Ensure generated_lessons directory exists
const generatedLessonsDir = path.join(__dirname, 'generated_lessons');
if (!fs.existsSync(generatedLessonsDir)) {
    fs.mkdirSync(generatedLessonsDir, { recursive: true });
}

// Initialize Gemini
// Use GEMINI_API_KEY from .env.local if available, otherwise API_KEY
const apiKey = process.env.GEMINI_API_KEY || process.env.API_KEY;

if (!apiKey) {
    console.error("Error: GEMINI_API_KEY or API_KEY not found in environment variables.");
    process.exit(1);
}

const ai = new GoogleGenAI({ apiKey });

app.post('/api/generate-lesson', async (req, res) => {
    try {
        const { topic, age } = req.body;

        if (!topic || !age) {
            return res.status(400).json({ error: 'Topic and age are required' });
        }

        console.log(`Generating lesson for topic: "${topic}", age: ${age}`);

        // Use a standard model
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
            // Handle if response.text is a function (in recent SDKs)
            if (typeof text === 'function') {
                text = text();
            }

            const lessonData = JSON.parse(text);

            // Save to file
            const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
            const sanitizedTopic = topic.replace(/[^a-z0-9]/gi, '_').toLowerCase();
            const filename = `lesson_${sanitizedTopic}_${age}_${timestamp}.json`;
            const filePath = path.join(generatedLessonsDir, filename);

            fs.writeFileSync(filePath, JSON.stringify(lessonData, null, 2));
            console.log(`Saved lesson to ${filePath}`);

            res.json(lessonData);
        } else {
            throw new Error("No response text from Gemini");
        }

    } catch (error) {
        console.error("Server Generation Error:", error);
        res.status(500).json({ error: error.message || "Failed to generate lesson" });
    }
});

app.listen(port, () => {
    console.log(`Server running at http://localhost:${port}`);
});
