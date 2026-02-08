"""LLM-based answer evaluator using Google Gemini"""

import json
import os
import re
from google import genai
from typing import Dict, Optional
from dotenv import load_dotenv
from pathlib import Path

# Load environment variables from .env file
env_path = Path(__file__).parent / '.env'
load_dotenv(dotenv_path=env_path)
print(f"[LLMEvaluator] Loading .env from: {env_path}")


class LLMEvaluator:
    """Evaluate answer correctness using Google Gemini"""
    
    def __init__(self, api_key: Optional[str] = None):
        """
        Initialize Gemini API client
        
        Args:
            api_key: Google API key (or set GOOGLE_API_KEY env var)
        """
        try:
            # Try provided key, then environment variable
            key = api_key or os.getenv("GOOGLE_API_KEY")
            
            print(f"[LLMEvaluator] Checking API key...")
            print(f"[LLMEvaluator] API Key from env: {key[:10] if key else 'NOT FOUND'}...")
            
            if not key:
                print("⚠️ No API key provided. Set GOOGLE_API_KEY environment variable or .env file")
                self.available = False
                return
            
            print(f"[LLMEvaluator] Configuring Gemini with API key...")
            self.client = genai.Client(api_key=key)
            self.model_name = 'gemini-2.0-flash'
            self.available = True
            print(f"✅ Google Gemini initialized ({self.model_name})")
        except Exception as e:
            print(f"⚠️ Gemini API not available: {e}")
            import traceback
            traceback.print_exc()
            self.available = False
    
    def evaluate_answer(
        self,
        candidate_answer: str,
        question: str,
        reference_answer: str,
        evaluation_rubric: Optional[str] = None
    ) -> Dict:
        """
        Evaluate if answer is correct using LLM
        
        Args:
            candidate_answer: The answer given by candidate (text)
            question: The question asked
            reference_answer: Expected/correct answer
            evaluation_rubric: Optional detailed rubric for evaluation
            
        Returns:
            dict with evaluation results
        """
        if not self.available:
            return {
                'is_correct': None,
                'score': 0.0,
                'reasoning': 'Gemini API not available',
                'error': 'API not configured'
            }
        
        if not candidate_answer or not candidate_answer.strip():
            return {
                'is_correct': False,
                'score': 0.0,
                'reasoning': 'No answer provided',
                'error': None
            }
        
        try:
            # Build evaluation prompt
            prompt = f"""Evaluate the following interview answer:

QUESTION: {question}

CANDIDATE'S ANSWER:
{candidate_answer}

REFERENCE/EXPECTED ANSWER:
{reference_answer}

{f'EVALUATION RUBRIC:{evaluation_rubric}' if evaluation_rubric else ''}

Please evaluate and provide:
1. Is the answer correct? (yes/no/partially)
2. Score out of 100 (0-100)
3. Key strengths in the answer
4. Key gaps or issues
5. Overall reasoning

Respond in JSON format:
{{
    "is_correct": "yes/no/partially",
    "score": <number 0-100>,
    "strengths": ["strength1", "strength2"],
    "gaps": ["gap1", "gap2"],
    "reasoning": "detailed reasoning"
}}"""
            
            # Call Gemini
            response = self.client.models.generate_content(
                model=self.model_name,
                contents=prompt
            )
            
            # Parse response
            try:
                response_text = response.text
                
                # Try to extract JSON from response
                json_match = re.search(r'\{.*\}', response_text, re.DOTALL)
                
                if json_match:
                    result = json.loads(json_match.group())
                else:
                    result = {
                        'is_correct': 'unknown',
                        'score': 0.0,
                        'reasoning': response_text
                    }
                
                return {
                    'is_correct': result.get('is_correct', 'unknown'),
                    'score': float(result.get('score', 0)),
                    'strengths': result.get('strengths', []),
                    'gaps': result.get('gaps', []),
                    'reasoning': result.get('reasoning', ''),
                    'error': None
                }
            
            except json.JSONDecodeError:
                return {
                    'is_correct': 'unknown',
                    'score': 0.0,
                    'reasoning': response.text,
                    'error': 'Could not parse response'
                }
        
        except Exception as e:
            print(f"❌ Evaluation error: {e}")
            return {
                'is_correct': None,
                'score': 0.0,
                'reasoning': str(e),
                'error': str(e)
            }
    
    def is_available(self):
        """Check if API is available"""
        return self.available

