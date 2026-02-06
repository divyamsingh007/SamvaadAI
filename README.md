# SamvaadAI - AI Powered Mock Interview and Practice Platform

SamvaadAI is an AI-powered mock interview platform designed to help users practice technical and behavioral interviews, evaluate their responses, and receive structured feedback.

The platform focuses on interview preparation and skill improvement by generating realistic interview questions, transcribing spoken answers, and providing intelligent analysis of responses.

SamvaadAI does not replace real interviews. It acts as a personal interview practice companion.

---

## Problem Statement

Many students and job seekers struggle to prepare effectively for interviews due to:

- Lack of access to realistic mock interviews  
- Limited personalized feedback  
- Anxiety and low confidence during practice  

Traditional preparation methods rely heavily on self-study, which does not simulate real interview conditions.

There is a need for a system that can:

- Conduct mock interviews on demand  
- Provide structured feedback  
- Help users identify strengths and weaknesses  
- Improve interview confidence  

---

## Solution

SamvaadAI simulates real interview scenarios by:

- Understanding user resumes  
- Generating role-specific mock interview questions  
- Recording and transcribing spoken answers  
- Evaluating answers using semantic analysis and scoring logic  
- Producing detailed practice reports  

---

## Key Features

- Resume upload and text extraction  
- Role-based mock interview question generation  
- Voice-based answer input  
- Speech-to-text transcription  
- Semantic answer evaluation  
- Intelligent scoring engine  
- Mock interview report  

---

## AI and Machine Learning Components

SamvaadAI integrates multiple AI and ML techniques:

1. Resume understanding using NLP  
2. Generative mock question creation using large language models  
3. Speech recognition  
4. Embedding-based semantic similarity  
5. Confidence estimation  
6. Weighted scoring algorithm  

This makes SamvaadAI an AI-driven practice system rather than a simple API wrapper.

---

## Technology Stack

Frontend  
- React (Vite)  
- Tailwind CSS  
- Axios  
- Web Speech API  

Backend  
- Django  
- Django REST Framework  
- OpenAI API or Gemini API  
- pdfplumber  
- python-dotenv  
- django-cors-headers  

Database  
- SQLite  

---

## Installation

### Clone Repository
-git clone https://github.com/divyamsingh007/SamvaadAI.git
-cd SamvaadAI

### Backend Setup


Create `.env` file:
OPENAI_API_KEY=your_api_key_here


Run backend server:

### Frontend Setup
-cd frontend
-npm install
-npm run dev

---

## Usage

1. Open the web application  
2. Upload resume in PDF format  
3. Select job role  
4. Click Start Mock Interview  
5. Answer questions using microphone  
6. Click Finish Interview  
7. View score and feedback  
