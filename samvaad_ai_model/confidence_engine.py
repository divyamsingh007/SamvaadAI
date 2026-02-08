import numpy as np
from feature_engine import ConfidenceFeatureEngine
from custom_scorer import CustomConfidenceScorer
from ml_scorer import ConfidenceMLScorer
from audioconfig import SAMPLE_RATE, CHUNK_DURATION
from feature_defs import FEATURE_NAMES


def chunk_audio(audio, chunk_size=None):
    if chunk_size is None:
        chunk_size = int(SAMPLE_RATE * CHUNK_DURATION)

    for i in range(0, len(audio) - chunk_size, chunk_size):
        chunk = audio[i:i + chunk_size]
        if len(chunk) == chunk_size:
            yield chunk


class ConfidenceEngine:

    def __init__(self, model_path, profile_name, profiles_dict, sample_rate=SAMPLE_RATE):
        self.feature_engine = ConfidenceFeatureEngine(sample_rate)
        self.ml_scorer = ConfidenceMLScorer(model_path)
        self.custom_scorer = CustomConfidenceScorer(profiles_dict[profile_name])
        self.sample_rate = sample_rate
        self.profile_name = profile_name
        self.profiles_dict = profiles_dict

    def score_audio(self, audio):
        if audio is None or len(audio) == 0:
            return {
                'confidence': 0.0,
                'ml_confidence': None,
                'features': None,
                'speech_detected': False,
                'audio_duration': 0.0
            }

        self.feature_engine.reset()
        self.custom_scorer.reset()

        chunk_size = int(self.sample_rate * 0.5)
        for chunk in chunk_audio(audio, chunk_size):
            self.feature_engine.process_chunk(chunk)

        if not self.feature_engine.features_ready():
            return {
                'confidence': 0.0,
                'ml_confidence': None,
                'features': None,
                'speech_detected': False,
                'audio_duration': len(audio) / self.sample_rate
            }

        try:
            features_clipped, features_raw = self.feature_engine.extract_features()
        except Exception:
            return {
                'confidence': 0.0,
                'ml_confidence': None,
                'features': None,
                'speech_detected': False,
                'audio_duration': len(audio) / self.sample_rate
            }

        try:
            custom_confidence = self.custom_scorer.score(features_clipped)
        except Exception:
            custom_confidence = 50.0

        try:
            ml_confidence = self.ml_scorer.score(features_clipped)
        except Exception:
            ml_confidence = None

        feature_dict = dict(zip(FEATURE_NAMES, features_raw.tolist()))

        return {
            'confidence': float(custom_confidence),
            'ml_confidence': ml_confidence,
            'features': feature_dict,
            'features_raw': features_raw,
            'features_clipped': features_clipped,
            'speech_detected': True,
            'audio_duration': len(audio) / self.sample_rate
        }

    def switch_profile(self, new_profile_name):
        self.profile_name = new_profile_name
        self.custom_scorer = CustomConfidenceScorer(self.profiles_dict[new_profile_name])

    def get_available_profiles(self):
        return {name: p.get('description', '') for name, p in self.profiles_dict.items()}

    def get_model_status(self):
        return {'available': self.ml_scorer.is_available()}