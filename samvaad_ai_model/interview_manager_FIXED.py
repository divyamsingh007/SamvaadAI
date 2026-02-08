"""Interview manager - FIXED simple imports"""

import numpy as np
from datetime import datetime
import json
import os
from audio_recorder import AudioRecorder
from confidence_engine_FIXED import ConfidenceEngine
from scoring_profiles import SCORING_PROFILES
from audioconfig import SAMPLE_RATE


class InterviewManager:
    """Manage interview flow"""
    
    def __init__(self, model_path="confidence_model.pkl", profile="balanced"):
        self.recorder = AudioRecorder(sample_rate=SAMPLE_RATE)
        self.conf_engine = ConfidenceEngine(
            model_path=model_path,
            profile_name=profile,
            profiles_dict=SCORING_PROFILES,
            sample_rate=SAMPLE_RATE
        )
        self.answers = []
        self.candidate_name = ""
        self.interview_start_time = None
    
    def start_interview(self, candidate_name):
        """Start interview"""
        self.candidate_name = candidate_name
        self.answers = []
        self.interview_start_time = datetime.now()
        
        print(f"\n{'='*70}")
        print(f"🎤 INTERVIEW STARTED")
        print(f"{'='*70}")
        print(f"Candidate: {candidate_name}")
        print(f"Profile: {self.conf_engine.profile_name}")
        print(f"{'='*70}\n")
    
    def ask_question(self, question_num, question_text, max_duration=15):
        """Ask question and record answer"""
        print(f"\n{'='*70}")
        print(f"Question {question_num}")
        print(f"{'='*70}")
        print(f"\n❓ {question_text}\n")
        
        input("Press Enter when ready to answer...")
        
        audio = self.recorder.record(max_duration=max_duration)
        result = self.conf_engine.score_audio(audio)
        
        answer = {
            'question_number': question_num,
            'question_text': question_text,
            'confidence_score': result['confidence'],
            'ml_confidence': result['ml_confidence'],
            'speech_duration': result['audio_duration'],
            'speech_detected': result['speech_detected'],
            'timestamp': datetime.now().isoformat(),
            'speech_features': result['features']
        }
        
        self.answers.append(answer)
        
        # Display results
        print(f"\n{'-'*70}")
        print(f"✅ Duration: {result['audio_duration']:.1f}s")
        print(f"📊 Confidence: {result['confidence']:.1f}/100")
        if result['ml_confidence'] is not None:
            print(f"🤖 ML Model: {result['ml_confidence']:.1f}/100")
        
        if result['confidence'] >= 85:
            rating = "⭐⭐⭐ EXCELLENT"
        elif result['confidence'] >= 70:
            rating = "⭐⭐ VERY GOOD"
        elif result['confidence'] >= 55:
            rating = "⭐ GOOD"
        else:
            rating = "FAIR"
        
        print(f"Rating: {rating}")
        
        if result['features']:
            print(f"\n📈 Features:")
            for name, value in result['features'].items():
                print(f"   • {name}: {value:.2f}")
        
        print(f"{'-'*70}")
        
        return answer
    
    def save_answers(self, output_dir="."):
        """Save all answers to JSON"""
        os.makedirs(output_dir, exist_ok=True)
        
        print(f"\n{'='*70}")
        print(f"💾 SAVING RESULTS")
        print(f"{'='*70}\n")
        
        for answer in self.answers:
            payload = {
                'interview_metadata': {
                    'timestamp': datetime.now().isoformat(),
                    'candidate_name': self.candidate_name,
                    'question_number': answer['question_number'],
                    'question_text': answer['question_text'],
                },
                'answer_analysis': {
                    'confidence_score': answer['confidence_score'],
                    'ml_confidence': answer['ml_confidence'],
                    'speech_duration': answer['speech_duration'],
                    'speech_detected': answer['speech_detected'],
                    'speech_features': answer['speech_features']
                }
            }
            
            filename = f"answer_q{answer['question_number']}_{datetime.now().strftime('%Y%m%d_%H%M%S')}.json"
            filepath = os.path.join(output_dir, filename)
            
            with open(filepath, 'w') as f:
                json.dump(payload, f, indent=2)
            
            print(f"✅ Saved: {filename}")
    
    def save_summary(self, output_dir="."):
        """Save interview summary"""
        if not self.answers:
            return
        
        os.makedirs(output_dir, exist_ok=True)
        
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
        
        print(f"✅ Summary: {filename}")
    
    def display_summary(self):
        """Display interview summary"""
        if not self.answers:
            return
        
        scores = [a['confidence_score'] for a in self.answers]
        avg = np.mean(scores)
        
        print(f"\n{'='*70}")
        print(f"📊 INTERVIEW COMPLETE")
        print(f"{'='*70}")
        print(f"\nCandidate: {self.candidate_name}")
        print(f"Questions: {len(self.answers)}")
        print(f"Average Confidence: {avg:.1f}/100")
        print(f"Range: {min(scores):.1f} - {max(scores):.1f}")
        
        if avg >= 85:
            assessment = "⭐⭐⭐ EXCELLENT"
        elif avg >= 70:
            assessment = "⭐⭐ VERY GOOD"
        elif avg >= 55:
            assessment = "⭐ GOOD"
        else:
            assessment = "FAIR"
        
        print(f"Overall: {assessment}")
        print(f"{'='*70}\n")
