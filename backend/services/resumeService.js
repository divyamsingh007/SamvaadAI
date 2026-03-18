import { GoogleGenerativeAI } from "@google/generative-ai";

export const analyzeResumeContent = async (text) => {
  try {
    const ai = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
    const model = ai.getGenerativeModel({ model: "gemini-2.5-flash" });
    
    const prompt = `
    You are an expert ATS (Applicant Tracking System) Analyzer and Technical Recruiter.
    I am going to provide you with the extracted text from a candidate's resume.
    
    You must extract the information and return ONLY a strict JSON object with the following structure. Do NOT wrap it in markdown blockquotes like "\`\`\`json". Just return the raw JSON string.

    {
      "personal_info": {
        "name": "",
        "email": "",
        "phone": "",
        "links": []
      },
      "education": [
        { "degree": "", "institution": "", "year": "" }
      ],
      "experience": [
        { "company": "", "role": "", "duration": "", "highlights": [] }
      ],
      "skills": {
        "technical": [],
        "soft_skills": []
      },
      "analysis": {
        "ats_score": 0, // A number from 0 to 100 based on formatting, action verbs, keyword density, and overall impact.
        "strengths": ["", ""],
        "weaknesses": ["", ""]
      },
      "interview_questions": {
        "easy": ["", ""], // Generate 3 basic questions validating their experience
        "medium": ["", ""], // Generate 3 scenario-based / framework-specific questions
        "hard": ["", ""] // Generate 3 deep-dive technical or behavioral questions testing limits
      }
    }

    Here is the resume text:
    =============
    ${text}
    =============
    
    RETURN ONLY JSON. No other text.
    `;

    const result = await model.generateContent(prompt);
    const response = await result.response;
    let responseText = response.text();
    
    // Aggressive JSON cleanup
    responseText = responseText.replace(/```json/gi, "");
    responseText = responseText.replace(/```/g, "");
    responseText = responseText.trim();

    return JSON.parse(responseText);
  } catch (error) {
    console.error("Error analyzing resume with Gemini:", error);
    throw error;
  }
};
