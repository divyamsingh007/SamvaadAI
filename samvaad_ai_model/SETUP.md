# Setup Guide: Audio Scoring with LLM Evaluation

## Overview
This system records interviews, transcribes audio to text, scores confidence, and evaluates answers using Google Gemini LLM.

## System Components

1. **Audio Recording** - Records candidate answers
2. **Confidence Scoring** - Analyzes speaking patterns (pitch, pauses, etc.)
3. **Speech-to-Text** - Transcribes audio to text (Google Cloud Speech-to-Text)
4. **LLM Evaluation** - Evaluates answer correctness (Google Gemini)
5. **JSON Output** - Stores all results in structured JSON files

## Setup Instructions

### 1. Install Dependencies
```bash
pip install -r requirements.txt
```

### 2. Set Up Google Cloud APIs

#### Option A: Using Service Account (for Speech-to-Text)
1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project
3. Enable "Cloud Speech-to-Text API"
4. Create a Service Account:
   - IAM & Admin → Service Accounts → Create Service Account
   - Grant "Editor" role
   - Create JSON key
5. Set environment variable:
   ```bash
   # Windows PowerShell
   $env:GOOGLE_APPLICATION_CREDENTIALS = "C:\path\to\credentials.json"
   
   # Windows Command Prompt
   set GOOGLE_APPLICATION_CREDENTIALS=C:\path\to\credentials.json
   ```

#### Option B: Using API Key (for Gemini)
1. Go to [Google AI Studio](https://aistudio.google.com/app/apikey)
2. Create/get your API key
3. Set environment variable:
   ```bash
   # Windows PowerShell
   $env:GOOGLE_API_KEY = "your-api-key-here"
   
   # Windows Command Prompt
   set GOOGLE_API_KEY=your-api-key-here
   ```

#### Option C: .env File
Create a `.env` file in the project root:
```
GOOGLE_APPLICATION_CREDENTIALS=C:\path\to\credentials.json
GOOGLE_API_KEY=your-api-key-here
```

### 3. Customize Reference Answers
Edit `reference_answers.json` to add your expected answers for each question:
```json
{
  "reference_answers": {
    "1": {
      "question": "Tell me about yourself...",
      "reference_answer": "Should include: education, experience, skills..."
    }
  }
}
```

## JSON Output Format

### Individual Answer File: `answer_q1_20260208_103725.json`
```json
{
  "interview_metadata": {
    "timestamp": "2026-02-08T10:37:25...",
    "candidate_name": "John Doe",
    "question_number": 1,
    "question_text": "Tell me about yourself..."
  },
  "answer_analysis": {
    "confidence_score": 76.81,
    "ml_confidence": 55.53,
    "speech_duration": 15.0,
    "speech_detected": true,
    "speech_features": {
      "pause_freq": 0.0,
      "pitch_std": 17.75
    }
  },
  "transcription": {
    "text": "My name is John and I have 5 years of experience...",
    "confidence": 0.95,
    "error": null
  },
  "evaluation": {
    "is_correct": "yes",
    "score": 85,
    "strengths": ["Clear structure", "Relevant experience"],
    "gaps": ["Could mention specific projects"],
    "reasoning": "Answer addresses key points...",
    "error": null
  }
}
```

### Summary File: `interview_summary_20260208_103725.json`
Contains:
- Interview metadata (candidate name, total questions, average scores)
- All individual answers with complete data
- Overall statistics

## Running the Interview

```bash
python main.py
```

Follow the prompts:
1. Choose scoring profile (balanced, strict, lenient)
2. Enter candidate name
3. Choose number of questions
4. Answer each question when prompted
5. All results are automatically saved to JSON files

## Data Flow

```
Audio Recording
     ↓
Confidence Scoring (speaking patterns)
     ↓
Speech-to-Text (transcription)
     ↓
LLM Evaluation (answer correctness)
     ↓
JSON Output (complete record)
```

## Keys in Evaluation JSON

- **is_correct**: "yes" / "no" / "partially"
- **score**: 0-100 (LLM's assessment of answer quality)
- **strengths**: List of answer strengths
- **gaps**: List of areas for improvement
- **reasoning**: Detailed explanation of evaluation

## Troubleshooting

### "Google Speech-to-Text not available"
- Check `GOOGLE_APPLICATION_CREDENTIALS` is set
- Verify credentials.json file exists and is valid
- Confirm Cloud Speech-to-Text API is enabled

### "Gemini API not available"
- Check `GOOGLE_API_KEY` is set
- Verify API key is valid
- Check API limits/quota on Google AI Studio

### Missing transcription or evaluation
- Check Google Cloud credentials are properly configured
- Verify API keys have necessary permissions
- Check internet connection

## Example Use Cases

1. **Technical Interview Evaluation**: Score technical interviews with code examples
2. **Customer Service Training**: Evaluate support agent responses
3. **Sales Training**: Assess sales pitch quality and effectiveness
4. **Recruitment**: Automate candidate answer evaluation
5. **Language Learning**: Evaluate pronunciation and response quality

## Notes

- All audio is processed locally (only sent to Google APIs for transcription/evaluation)
- Results are saved immediately after each question
- No audio files are stored (only transcriptions and evaluations)
- Each answer gets a unique JSON file for easy processing
