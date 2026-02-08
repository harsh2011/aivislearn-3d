# AI Vizual Learning

An interactive 3D visual learning platform that builds magical worlds based on your topics.

## Features

- **3D Lesson Generation**: Generate complex 3D scenes to explain topics visually.
- **Age-Appropriate Content**: Content tailored for different age groups (Toddler to Pre-teen).
- **Interactive Quiz**: Test your knowledge with automatically generated quizzes.
- **Local Server**: Securely handles generation logic and saves history locally.

## Setup & Running

**Prerequisites:** Node.js (v18+)

1. **Install Dependencies**:
   ```bash
   npm install
   cd server && npm install
   cd ..
   ```

2. **Configure API Key**:
   Set your `API_KEY` in [.env.local](.env.local).

3. **Run the Application**:
   ```bash
   npm run dev
   ```
   This command uses `concurrently` to start both the local Express server (port 3001) and the Vite frontend (port 3000).

## Project Structure

- `/components`: React UI components and 3D scenes.
- `/services`: Frontend API services.
- `/server`: Express backend for lesson generation and file storage.
- `/server/generated_lessons`: Local storage for all generated lesson JSONs.
