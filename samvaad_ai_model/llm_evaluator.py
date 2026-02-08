import json
import os
import re
from google import genai
from typing import Dict, Optional
from dotenv import load_dotenv
from pathlib import Path

env_path = Path(__file__).parent / '.env'
load_dotenv(dotenv_path=env_path)


class LLMEvaluator:

    def __init__(self, api_key: Optional[str] = None):
        try:
            key = api_key or os.getenv("GOOGLE_API_KEY")

            if not key:
                self.available = False
                return

            self.client = genai.Client(api_key=key)
            self.model_name = 'gemini-2.0-flash'
            self.available = True
        except Exception as e:
            self.available = False

    def evaluate_answer(
        self,
        candidate_answer: str,
        question: str,
        reference_answer: str,
        evaluation_rubric: Optional[str] = None
    ) -> Dict:
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

            response = self.client.models.generate_content(
                model=self.model_name,
                contents=prompt
            )

            try:
                response_text = response.text

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
            return {
                'is_correct': None,
                'score': 0.0,
                'reasoning': str(e),
                'error': str(e)
            }

    def is_available(self):
        return self.available

