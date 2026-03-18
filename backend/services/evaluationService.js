import { GoogleGenerativeAI } from "@google/generative-ai";

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

const EVALUATION_PARAMETERS = [
  "Communication skills", "Technical knowledge", "Problem-solving ability",
  "Logical reasoning", "Analytical thinking", "Confidence level",
  "Clarity of thought", "Domain knowledge", "Practical application skills",
  "Coding ability", "System design skills", "Creativity", "Adaptability",
  "Learning attitude", "Teamwork", "Leadership potential", "Time management",
  "Stress handling ability", "Decision-making skills", "Behavioral fit",
  "Cultural fit", "Body language", "Eye contact", "Listening skills",
  "Question understanding", "Response structure", "Accuracy of answers",
  "Attention to detail", "Professionalism", "Ethics and integrity",
  "Initiative", "Enthusiasm", "Motivation", "Career clarity",
  "Past experience relevance", "Project explanation ability",
  "Presentation skills", "Interpersonal skills", "Negotiation skills",
  "Conflict resolution ability", "Ownership mindset", "Reliability",
  "Consistency", "Curiosity", "Feedback receptiveness", "Growth mindset"
];

export const evaluateInterviewTranscript = async (transcriptArray) => {
  try {
    const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });

    const transcriptText = Array.isArray(transcriptArray) 
      ? transcriptArray.join("\n") 
      : transcriptArray;

    const prompt = `You are an expert technical recruiter, behavioral psychologist, and senior engineering manager.
I will provide you with a transcript of a mock interview.
I need you to meticulously evaluate the candidate ("You") based on their responses.

For the evaluation, score the candidate on a scale of 0 to 100 for the following parameters. 
Only evaluate parameters that are remotely applicable or can be inferred (even loosely) from the transcript. If a parameter is completely inapplicable (like 'Body language' or 'Eye contact' since this is an audio/text transcript), score it moderately around 50-60 or skip it if needed, but try to evaluate as many as possible based on the text.
Parameters:
${EVALUATION_PARAMETERS.join(", ")}

You must return EXACTLY ONE JSON object matching this structure (no markdown fences, just the raw JSON):
{
  "totalScore": 0, // Average across all evaluated categories (0-100)
  "categoryScores": [
    {
      "name": "Parameter Name",
      "score": 0, // 0-100
      "comment": "Brief 1-sentence justification"
    }
    // ... include as many parameters from the list above as applicable
  ],
  "strengths": ["Strength 1", "Strength 2"], // Extract top 3-4 strengths
  "areasForImprovement": ["Area 1", "Area 2"], // Extract 3-4 actionable improvements
  "finalAssessment": "A 3-4 sentence comprehensive final assessment of the candidate."
}

Transcript:
"""
${transcriptText}
"""
`;

    const result = await model.generateContent(prompt);
    const responseText = result.response.text();

    // Clean up potential markdown formatting
    const cleanedText = responseText.replace(/^[^{]*{/, '{').replace(/}[^}]*$/, '}');
    const evaluation = JSON.parse(cleanedText);
    
    // Ensure all required fields exist
    if (!evaluation.totalScore || !evaluation.categoryScores || !evaluation.finalAssessment) {
      throw new Error("Missing required evaluation fields in AI response");
    }

    return evaluation;
  } catch (error) {
    console.error("Error evaluating transcript with AI:", error);
    // Fallback evaluation structure if AI fails
    return {
      totalScore: 50,
      categoryScores: [{ name: "Error", score: 50, comment: "Failed to accurately parse AI response." }],
      strengths: ["Completed the interview."],
      areasForImprovement: ["Review response format."],
      finalAssessment: "An error occurred while evaluating the interview transcript via AI. Please try again."
    };
  }
};
