"""Custom profile-based confidence scorer - FIXED simple imports"""

import numpy as np
from feature_defs import FEATURE_BOUNDS, FEATURE_NAMES


class CustomConfidenceScorer:
    """Score confidence using weighted features"""
    
    def __init__(self, profile_config):
        """Initialize with profile weights"""
        self.weights = np.array([
            profile_config['weights']['pause_freq'],
            profile_config['weights']['avg_pause'],
            profile_config['weights']['silence_ratio'],
            profile_config['weights']['speech_rate'],
            profile_config['weights']['pitch_std']
        ], dtype=float)
        self.prev_conf = None
    
    def score(self, features):
        """Score features using profile weights"""
        # Normalize features
        normalized = np.array([
            (features[i] - FEATURE_BOUNDS[FEATURE_NAMES[i]][0]) / 
            (FEATURE_BOUNDS[FEATURE_NAMES[i]][1] - FEATURE_BOUNDS[FEATURE_NAMES[i]][0])
            for i in range(len(features))
        ])
        
        normalized = np.clip(normalized, 0, 1)
        
        # Invert where needed (lower is better)
        inverted = np.array([
            1 - normalized[0],  # pause_freq
            1 - normalized[1],  # avg_pause
            1 - normalized[2],  # silence_ratio
            normalized[3],      # speech_rate
            1 - normalized[4]   # pitch_std
        ])
        
        # Apply weights
        weighted_score = np.dot(inverted, np.abs(self.weights))
        total_weight = np.sum(np.abs(self.weights))
        confidence = (weighted_score / total_weight) * 100 if total_weight > 0 else 0
        
        confidence = float(np.clip(confidence, 0, 100))
        return confidence
    
    def reset(self):
        """Reset state"""
        self.prev_conf = None
