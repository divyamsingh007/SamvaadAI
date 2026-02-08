import numpy as np
import joblib
import os


class ConfidenceMLScorer:

    def __init__(self, model_path):
        self.model_path = model_path
        self.model = None
        self.has_model = False

        if os.path.exists(model_path):
            try:
                self.model = joblib.load(model_path)
                self.has_model = True
            except Exception:
                pass

    def score(self, features):
        if not self.has_model or self.model is None:
            return None

        try:
            features = np.asarray(features, dtype=float)
            pred = self.model.predict([features])[0]
            pred_clipped = np.clip(float(pred), 1.0, 5.0)
            confidence = (pred_clipped - 1.0) / 4.0 * 100.0
            return float(confidence)
        except Exception:
            return None

    def is_available(self):
        return self.has_model