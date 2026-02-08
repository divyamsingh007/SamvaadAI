"""Main confidence scoring engine - WITH DEBUGGING"""

import numpy as np
from feature_engine import ConfidenceFeatureEngine
from custom_scorer import CustomConfidenceScorer
from ml_scorer import ConfidenceMLScorer
from audioconfig import SAMPLE_RATE, CHUNK_DURATION
from feature_defs import FEATURE_NAMES


def chunk_audio(audio, chunk_size=None):
    """Split audio into chunks"""
    if chunk_size is None:
        chunk_size = int(SAMPLE_RATE * CHUNK_DURATION)
    
    for i in range(0, len(audio) - chunk_size, chunk_size):
        chunk = audio[i:i + chunk_size]
        if len(chunk) == chunk_size:
            yield chunk


class ConfidenceEngine:
    """Main confidence scoring engine"""
    
    def __init__(self, model_path, profile_name, profiles_dict, sample_rate=SAMPLE_RATE):
        """Initialize engine"""
        print(f"[Engine] Initializing with profile: {profile_name}")
        self.feature_engine = ConfidenceFeatureEngine(sample_rate)
        self.ml_scorer = ConfidenceMLScorer(model_path)
        self.custom_scorer = CustomConfidenceScorer(profiles_dict[profile_name])
        self.sample_rate = sample_rate
        self.profile_name = profile_name
        self.profiles_dict = profiles_dict
    
    def score_audio(self, audio):
        """Score complete audio"""
        print(f"\n[Engine] Scoring audio: {len(audio)} samples ({len(audio)/self.sample_rate:.1f}s)")
        
        if audio is None or len(audio) == 0:
            print(f"[Engine] ❌ No audio provided")
            return {
                'confidence': 0.0,
                'ml_confidence': None,
                'features': None,
                'speech_detected': False,
                'audio_duration': 0.0
            }
        
        self.feature_engine.reset()
        self.custom_scorer.reset()
        
        # Process audio in chunks
        print(f"[Engine] Processing chunks...")
        chunk_size = int(self.sample_rate * 0.5)
        chunk_num = 0
        for chunk in chunk_audio(audio, chunk_size):
            chunk_num += 1
            self.feature_engine.process_chunk(chunk)
        
        print(f"[Engine] Processed {chunk_num} chunks")
        
        # Check if features are ready
        print(f"[Engine] Checking if features are ready...")
        if not self.feature_engine.features_ready():
            print(f"[Engine] ❌ Features not ready")
            return {
                'confidence': 0.0,
                'ml_confidence': None,
                'features': None,
                'speech_detected': False,
                'audio_duration': len(audio) / self.sample_rate
            }
        
        # Extract features
        print(f"[Engine] Extracting features...")
        try:
            features_clipped, features_raw = self.feature_engine.extract_features()
            print(f"[Engine] ✅ Features extracted: {features_clipped}")
        except Exception as e:
            print(f"[Engine] ❌ Error extracting features: {e}")
            import traceback
            traceback.print_exc()
            return {
                'confidence': 0.0,
                'ml_confidence': None,
                'features': None,
                'speech_detected': False,
                'audio_duration': len(audio) / self.sample_rate
            }
        
        # Score with custom scorer
        print(f"[Engine] Scoring with custom scorer...")
        try:
            custom_confidence = self.custom_scorer.score(features_clipped)
            print(f"[Engine] ✅ Custom score: {custom_confidence:.1f}")
        except Exception as e:
            print(f"[Engine] ⚠️ Error in custom scorer: {e}")
            custom_confidence = 50.0  # Default to middle
        
        # Score with ML model
        print(f"[Engine] Scoring with ML model...")
        try:
            ml_confidence = self.ml_scorer.score(features_clipped)
            print(f"[Engine] ✅ ML score: {ml_confidence}")
        except Exception as e:
            print(f"[Engine] ⚠️ Error in ML scorer: {e}")
            ml_confidence = None
        
        # Create feature dictionary
        feature_dict = dict(zip(FEATURE_NAMES, features_raw.tolist()))
        
        result = {
            'confidence': float(custom_confidence),
            'ml_confidence': ml_confidence,
            'features': feature_dict,
            'features_raw': features_raw,
            'features_clipped': features_clipped,
            'speech_detected': True,
            'audio_duration': len(audio) / self.sample_rate
        }
        
        print(f"[Engine] ✅ Final result: confidence={result['confidence']:.1f}")
        return result
    
    def switch_profile(self, new_profile_name):
        """Switch to different profile"""
        self.profile_name = new_profile_name
        self.custom_scorer = CustomConfidenceScorer(self.profiles_dict[new_profile_name])
    
    def get_available_profiles(self):
        """Get available profiles"""
        return {name: p.get('description', '') for name, p in self.profiles_dict.items()}
    
    def get_model_status(self):
        """Check model status"""
        return {'available': self.ml_scorer.is_available()}