import joblib
import numpy as np

class ConfidenceMLModel:
    """Wrapper for ML model"""
    
    def __init__(self, path):
        self.model = joblib.load(path)
    
    def predict_confidence(self, features):
        """Predict confidence from features"""
        pred = self.model.predict([features])[0]
        pred = np.clip(pred, 1.0, 5.0)
        return (pred - 1.0) / 4.0 * 100.0