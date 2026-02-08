import numpy as np
from datetime import datetime
import json
import os
from audio_recorder import AudioRecorder
from confidence_engine import ConfidenceEngine
from scoring_profiles import SCORING_PROFILES
from audioconfig import SAMPLE_RATE
from speech_to_text import SpeechToTextConverter
from llm_evaluator import LLMEvaluator


class InterviewManager:

    def __init__(self, model_path="confidence_model.pkl", profile="balanced"):
        self.recorder = AudioRecorder(sample_rate=SAMPLE_RATE)

        self.conf_engine = ConfidenceEngine(
            model_path=model_path,
            profile_name=profile,
            profiles_dict=SCORING_PROFILES,
            sample_rate=SAMPLE_RATE
        )

        self.stt = SpeechToTextConverter(sample_rate=SAMPLE_RATE)
        self.llm_evaluator = LLMEvaluator()
        self.reference_answers = self._load_reference_answers()

        self.answers = []
        self.candidate_name = ""
        self.interview_start_time = None

    def _load_reference_answers(self):
        try:
            with open('reference_answers.json', 'r') as f:
                data = json.load(f)
                return data.get('reference_answers', {})
        except:
            return {}

    def start_interview(self, candidate_name):
        self.candidate_name = candidate_name
        self.answers = []
        self.interview_start_time = datetime.now()

        print(f"\n{'='*70}")
        print(f"INTERVIEW STARTED")
        print(f"{'='*70}")
        print(f"Candidate: {candidate_name}")
        print(f"Profile: {self.conf_engine.profile_name}")
        print(f"{'='*70}\n")

    def ask_question(self, question_num, question_text, max_duration=15):
        print(f"\n{'='*70}")
        print(f"Question {question_num}")
        print(f"{'='*70}")
        print(f"\n{question_text}\n")

        input("Press Enter when ready to answer...")

        try:
            audio = self.recorder.record(max_duration=max_duration)
        except Exception as e:
            print(f"Error recording audio: {e}")
            return None

        try:
            result = self.conf_engine.score_audio(audio)
        except Exception as e:
            print(f"Error scoring audio: {e}")
            return None

        transcription = {'text': '', 'confidence': 0.0, 'error': None}
        if self.stt.is_available():
            try:
                transcription = self.stt.transcribe(audio)
            except Exception as e:
                transcription['error'] = str(e)

        evaluation = {
            'is_correct': None,
            'score': 0.0,
            'reasoning': 'Evaluation not performed',
            'error': None
        }

        if self.llm_evaluator.is_available() and transcription['text']:
            try:
                ref_answer_key = str(question_num)
                reference = self.reference_answers.get(ref_answer_key, {})
                reference_text = reference.get('reference_answer', '')

                if reference_text:
                    evaluation = self.llm_evaluator.evaluate_answer(
                        candidate_answer=transcription['text'],
                        question=question_text,
                        reference_answer=reference_text
                    )
            except Exception as e:
                evaluation['error'] = str(e)

        answer = {
            'question_number': question_num,
            'question_text': question_text,
            'confidence_score': result['confidence'],
            'ml_confidence': result['ml_confidence'],
            'speech_duration': result['audio_duration'],
            'speech_detected': result['speech_detected'],
            'timestamp': datetime.now().isoformat(),
            'speech_features': result['features'],
            'transcription': {
                'text': transcription.get('text', ''),
                'confidence': transcription.get('confidence', 0.0),
                'error': transcription.get('error')
            },
            'evaluation': {
                'is_correct': evaluation.get('is_correct'),
                'score': evaluation.get('score'),
                'strengths': evaluation.get('strengths', []),
                'gaps': evaluation.get('gaps', []),
                'reasoning': evaluation.get('reasoning', ''),
                'error': evaluation.get('error')
            }
        }

        self.answers.append(answer)

        print(f"\n{'-'*70}")
        print(f"Duration: {result['audio_duration']:.1f}s")
        print(f"Confidence: {result['confidence']:.1f}/100")
        if result['ml_confidence'] is not None:
            print(f"ML Model: {result['ml_confidence']:.1f}/100")

        if result['confidence'] >= 85:
            rating = "EXCELLENT"
        elif result['confidence'] >= 70:
            rating = "VERY GOOD"
        elif result['confidence'] >= 55:
            rating = "GOOD"
        else:
            rating = "FAIR"

        print(f"Rating: {rating}")

        if result['features']:
            print(f"\nFeatures:")
            for name, value in result['features'].items():
                print(f"   {name}: {value:.2f}")

        print(f"{'-'*70}")

        return answer

    def save_answers(self, output_dir="."):
        os.makedirs(output_dir, exist_ok=True)

        if not self.answers:
            return

        for i, answer in enumerate(self.answers, 1):
            try:
                payload = {
                    'interview_metadata': {
                        'timestamp': datetime.now().isoformat(),
                        'candidate_name': self.candidate_name,
                        'question_number': answer['question_number'],
                        'question_text': answer['question_text'],
                    },
                    'answer_analysis': {
                        'confidence_score': float(answer['confidence_score']),
                        'ml_confidence': float(answer['ml_confidence']) if answer['ml_confidence'] else None,
                        'speech_duration': float(answer['speech_duration']),
                        'speech_detected': bool(answer['speech_detected']),
                        'speech_features': answer['speech_features']
                    },
                    'transcription': {
                        'text': answer['transcription']['text'],
                        'confidence': float(answer['transcription']['confidence']),
                        'error': answer['transcription']['error']
                    },
                    'evaluation': {
                        'is_correct': answer['evaluation']['is_correct'],
                        'score': float(answer['evaluation']['score']) if answer['evaluation']['score'] else None,
                        'strengths': answer['evaluation']['strengths'],
                        'gaps': answer['evaluation']['gaps'],
                        'reasoning': answer['evaluation']['reasoning'],
                        'error': answer['evaluation']['error']
                    }
                }

                filename = f"answer_q{answer['question_number']}_{datetime.now().strftime('%Y%m%d_%H%M%S')}.json"
                filepath = os.path.join(output_dir, filename)

                with open(filepath, 'w') as f:
                    json.dump(payload, f, indent=2)
            except Exception as e:
                print(f"Error saving answer {i}: {e}")

    def save_summary(self, output_dir="."):
        if not self.answers:
            return

        os.makedirs(output_dir, exist_ok=True)

        try:
            scores = [a['confidence_score'] for a in self.answers]

            summary = {
                'interview_summary': {
                    'candidate_name': self.candidate_name,
                    'total_questions': len(self.answers),
                    'average_confidence': float(np.mean(scores)),
                    'min_confidence': float(np.min(scores)),
                    'max_confidence': float(np.max(scores)),
                },
                'answers': self.answers
            }

            filename = f"interview_summary_{datetime.now().strftime('%Y%m%d_%H%M%S')}.json"
            filepath = os.path.join(output_dir, filename)

            with open(filepath, 'w') as f:
                json.dump(summary, f, indent=2)
        except Exception as e:
            print(f"Error saving summary: {e}")

    def display_summary(self):
        if not self.answers:
            return

        scores = [a['confidence_score'] for a in self.answers]
        eval_scores = [a['evaluation']['score'] for a in self.answers if a['evaluation']['score']]

        avg = np.mean(scores)

        print(f"\n{'='*70}")
        print(f"INTERVIEW COMPLETE")
        print(f"{'='*70}")
        print(f"\nCandidate: {self.candidate_name}")
        print(f"Questions: {len(self.answers)}")
        print(f"Average Confidence: {avg:.1f}/100")
        print(f"Range: {min(scores):.1f} - {max(scores):.1f}")

        if eval_scores:
            eval_avg = np.mean(eval_scores)
            print(f"\nAverage Evaluation Score: {eval_avg:.1f}/100")

        if avg >= 85:
            assessment = "EXCELLENT"
        elif avg >= 70:
            assessment = "VERY GOOD"
        elif avg >= 55:
            assessment = "GOOD"
        else:
            assessment = "FAIR"

        print(f"Overall: {assessment}")
        print(f"{'='*70}\n")