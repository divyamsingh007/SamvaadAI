"""Feature extraction engine - FIXED simple imports"""

import time
from collections import deque
import numpy as np
from pitch import estimate_pitch_fft
from energy import compute_energy
from audioconfig import SAMPLE_RATE, CHUNK_DURATION, ANALYSIS_WINDOW
from feature_defs import FEATURE_NAMES, FEATURE_BOUNDS


class ConfidenceFeatureEngine:
    """Extracts 5 ML-ready features from audio"""
    
    def __init__(self, sample_rate=SAMPLE_RATE):
        self.sample_rate = sample_rate
        self.chunk_duration = CHUNK_DURATION
        self.analysis_window = ANALYSIS_WINDOW
        
        self.chunk_size = int(sample_rate * self.chunk_duration)
        max_chunks = int(self.analysis_window / self.chunk_duration)
        
        # Buffers for features
        self.voiced_buffer = deque(maxlen=max_chunks)
        self.pitch_buffer = deque(maxlen=30)
        self.recent_pauses = deque(maxlen=20)
        self.energy_buffer = deque(maxlen=10)
        
        # State
        self.is_speaking = False
        self.pause_start = None
        self.noise_floor = None
    
    def process_chunk(self, chunk):
        """Process one chunk of audio"""
        if chunk is None or len(chunk) == 0:
            return
        
        chunk = np.asarray(chunk, dtype=np.float32)
        
        # Compute energy
        energy = compute_energy(chunk)
        self.energy_buffer.append(energy)
        
        # Calibrate noise floor
        if self.noise_floor is None and len(self.energy_buffer) >= 10:
            self.noise_floor = float(np.median(list(self.energy_buffer)))
            return
        
        if self.noise_floor is None:
            return
        
        # Voice activity detection
        speaking = bool(energy > self.noise_floor + 10)
        self.voiced_buffer.append(speaking)
        
        # Track pauses
        now = time.time()
        
        if self.is_speaking and not speaking:
            self.pause_start = now
        elif not self.is_speaking and speaking and self.pause_start is not None:
            pause_duration = now - self.pause_start
            if pause_duration >= 0.4:
                self.recent_pauses.append(pause_duration)
            self.pause_start = None
        
        self.is_speaking = speaking
        
        # Extract pitch
        if speaking and energy > self.noise_floor + 15:
            pitch = estimate_pitch_fft(chunk, self.sample_rate)
            if pitch > 0:
                self.pitch_buffer.append(pitch)
    
    def features_ready(self) -> bool:
        """Check if ready to extract features"""
        if len(self.voiced_buffer) < 8:
            return False
        if len(self.recent_pauses) < 2:
            return False
        if len(self.pitch_buffer) < 15:
            return False
        if self.noise_floor is None:
            return False
        
        try:
            self.extract_features()
            return True
        except:
            return False
    
    def extract_features(self):
        """Extract 5 ML-ready features"""
        pause_freq = len(self.recent_pauses) / self.analysis_window * 60
        avg_pause = float(np.mean(list(self.recent_pauses))) if self.recent_pauses else 0.0
        
        silence_ratio = (
            1.0 - (sum(self.voiced_buffer) / len(self.voiced_buffer))
            if len(self.voiced_buffer) > 0
            else 0.0
        )
        
        if len(self.voiced_buffer) > 1:
            voiced_list = list(self.voiced_buffer)
            transitions = sum(1 for i in range(len(voiced_list)-1) 
                            if voiced_list[i] != voiced_list[i+1])
            speech_rate = transitions * 60 / self.analysis_window / 3
        else:
            speech_rate = 0.0
        
        pitch_std = float(np.std(list(self.pitch_buffer))) if len(self.pitch_buffer) > 5 else 0.0
        
        # Create vectors
        raw_features = np.array([pause_freq, avg_pause, silence_ratio, speech_rate, pitch_std], dtype=np.float32)
        
        clipped_features = np.array([
            np.clip(raw_features[i], FEATURE_BOUNDS[FEATURE_NAMES[i]][0], FEATURE_BOUNDS[FEATURE_NAMES[i]][1])
            for i in range(len(raw_features))
        ], dtype=np.float32)
        
        return clipped_features, raw_features
    
    def reset(self):
        """Reset all buffers"""
        self.voiced_buffer.clear()
        self.pitch_buffer.clear()
        self.recent_pauses.clear()
        self.energy_buffer.clear()
        self.is_speaking = False
        self.pause_start = None
        self.noise_floor = None
