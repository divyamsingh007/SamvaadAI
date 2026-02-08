import numpy as np
from feature_defs import FEATURE_BOUNDS, FEATURE_NAMES


class CustomConfidenceScorer:

    def __init__(self, profile_config):
        self.weights = np.array([
            profile_config['weights']['pause_freq'],
            profile_config['weights']['avg_pause'],
            profile_config['weights']['silence_ratio'],
            profile_config['weights']['speech_rate'],
            profile_config['weights']['pitch_std']
        ], dtype=float)
        self.prev_conf = None

    def score(self, features):
        normalized = np.array([
            (features[i] - FEATURE_BOUNDS[FEATURE_NAMES[i]][0]) /
            (FEATURE_BOUNDS[FEATURE_NAMES[i]][1] - FEATURE_BOUNDS[FEATURE_NAMES[i]][0])
            for i in range(len(features))
        ])

        normalized = np.clip(normalized, 0, 1)

        inverted = np.array([
            1 - normalized[0],
            1 - normalized[1],
            1 - normalized[2],
            normalized[3],
            1 - normalized[4]
        ])

        weighted_score = np.dot(inverted, np.abs(self.weights))
        total_weight = np.sum(np.abs(self.weights))
        confidence = (weighted_score / total_weight) * 100 if total_weight > 0 else 0

        confidence = float(np.clip(confidence, 0, 100))
        return confidence

    def reset(self):
        self.prev_conf = None
