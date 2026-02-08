"""Audio recording using sounddevice"""

import sounddevice as sd
import numpy as np

class AudioRecorder:
    """Simple audio recorder"""
    
    def __init__(self, sample_rate=16000):
        self.sample_rate = sample_rate
    
    def record(self, max_duration=15):
        """Record audio from microphone"""
        print(f"🔴 Recording... Speak now! ({max_duration} seconds)")
        
        audio = sd.rec(
            int(max_duration * self.sample_rate),
            samplerate=self.sample_rate,
            channels=1,
            dtype="float32",
            blocking=True
        )
        
        print("✅ Recording complete!")
        return audio.flatten()