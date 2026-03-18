import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';
import { analyzeResumeContent } from '../services/resumeService.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.join(__dirname, '../.env') });

async function run() {
    try {
        const fakeResume = `
        John Doe
        Software Engineer | React & Node.js
        Email: johndoe@example.com | Phone: 555-555-5555

        EDUCATION
        B.S. in Computer Science - University of State (2018-2022)

        EXPERIENCE
        Full Stack Developer - Tech Corp (2022-Present)
        - Built a scalable REST API using Node.js and Express
        - Created interactive UI components with React and Vite
        - Reduced database query times by 40%

        SKILLS
        Javascript, TypeScript, Python, React, Node.js, Express, MongoDB
        `;

        const result = await analyzeResumeContent(fakeResume);
        console.log("RESULT:", JSON.stringify(result, null, 2));
    } catch (e) {
        console.error("Test failed:", e);
    }
}

run();
