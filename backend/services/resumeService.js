import Groq from "groq-sdk";

const normalizeToJsonString = (raw) => {
  if (typeof raw !== "string") {
    throw new Error("Model response is empty or not a string.");
  }

  let text = raw.replace(/```json/gi, "").replace(/```/g, "").trim();

  // If model adds prose, keep only the outermost JSON object payload.
  const start = text.indexOf("{");
  const end = text.lastIndexOf("}");
  if (start !== -1 && end !== -1 && end > start) {
    text = text.slice(start, end + 1);
  }

  // Remove trailing commas before object/array end to avoid invalid JSON.
  text = text.replace(/,\s*([}\]])/g, "$1");

  JSON.parse(text);
  return text;
};

export const analyzeResumeContent = async (text) => {
  try {
    const groq = new Groq({
      apiKey: process.env.GROQ_API_KEY,
    });

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
                  
                  RETURN ONLY JSON in the string format. No other text.
                  `;

    const response = await groq.chat.completions.create({
      messages: [{ role: "system", content: prompt }],
      model: "llama-3.1-8b-instant",
    });
    const rawContent = response?.choices?.[0]?.message?.content;
    console.log(`[Groq Raw Response]: ${rawContent}`);
    const responseText = normalizeToJsonString(rawContent);

    return JSON.parse(responseText);
  } catch (error) {
    console.error("Error analyzing resume with Groq:", error);
    throw error;
  }
};
