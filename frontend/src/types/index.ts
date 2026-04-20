export interface Interview {
  id: string;
  _id?: string; // MongoDB ID
  userId: string;
  role: string;
  type: string;
  techstack: string[];
  level: string;
  questions: string[];
  finalized: boolean;
  createdAt: string;
  coverImage?: string;
}

export interface FeedbackCategory {
  name: string;
  score: number;
  comment: string;
}

export interface InterviewFeedback {
  totalScore: number;
  categoryScores: FeedbackCategory[];
  strengths: string[];
  areasForImprovement: string[];
  finalAssessment: string;
}

export interface User {
  id: string;
  username: string;
  email: string;
  firstName?: string;
  lastName?: string;
  role: string;
  isActive: boolean;
  isEmailVerified: boolean;
}
