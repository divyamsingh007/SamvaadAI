"""ML model-based confidence scorer"""

import numpy as np
import joblib
import os


class ConfidenceMLScorer:
    """Score confidence using pre-trained ML model"""
    
    def __init__(self, model_path):
        """Load ML model"""
        self.model_path = model_path
        self.model = None
        self.has_model = False
        
        if os.path.exists(model_path):
            try:
                self.model = joblib.load(model_path)
                self.has_model = True
                print(f"✅ Loaded ML model")
            except Exception as e:
                print(f"⚠️ Could not load model: {e}")
    
    def score(self, features):
        """Score using ML model"""
        if not self.has_model or self.model is None:
            return None
        
        try:
            features = np.asarray(features, dtype=float)
            pred = self.model.predict([features])[0]
            pred_clipped = np.clip(float(pred), 1.0, 5.0)
            confidence = (pred_clipped - 1.0) / 4.0 * 100.0
            return float(confidence)
        except:
            return None
    
    def is_available(self):
        """Check if model is available"""
        return self.has_model