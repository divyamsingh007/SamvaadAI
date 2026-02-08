SCORING_PROFILES = {
    "balanced": {
        "name": "Balanced",
        "description": "Equally weighted across all factors",
        "weights": {
            "pause_freq": -0.20,
            "avg_pause": -0.15,
            "silence_ratio": -0.25,
            "speech_rate": 0.15,
            "pitch_std": -0.05
        }
    },
    
    "delivery_fluency": {
        "name": "Delivery Fluency",
        "description": "Smooth, confident delivery",
        "weights": {
            "pause_freq": -0.25,
            "avg_pause": -0.20,
            "silence_ratio": -0.25,
            "speech_rate": 0.20,
            "pitch_std": -0.10
        }
    },
    
    "vocal_stability": {
        "name": "Vocal Stability",
        "description": "Voice consistency and steadiness",
        "weights": {
            "pause_freq": -0.05,
            "avg_pause": -0.05,
            "silence_ratio": 0.0,
            "speech_rate": 0.0,
            "pitch_std": -0.90
        }
    },
    
    "content_focus": {
        "name": "Content Focus",
        "description": "Meaningful speech vs filler",
        "weights": {
            "pause_freq": -0.10,
            "avg_pause": 0.0,
            "silence_ratio": -0.80,
            "speech_rate": 0.0,
            "pitch_std": -0.10
        }
    },
    
    "presence": {
        "name": "Presence",
        "description": "Engagement and clarity",
        "weights": {
            "pause_freq": -0.15,
            "avg_pause": -0.10,
            "silence_ratio": -0.30,
            "speech_rate": 0.10,
            "pitch_std": 0.0
        }
    },
}