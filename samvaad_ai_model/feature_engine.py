"""Feature extraction engine - SUPER LENIENT VERSION (guaranteed to work)"""

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
        self.all_energy_values = []  # Track all energy for statistics
        
        # State
        self.is_speaking = False
        self.pause_start = None
        self.noise_floor = None
        self.chunk_count = 0
    
    def process_chunk(self, chunk):
        """Process one chunk of audio"""
        if chunk is None or len(chunk) == 0:
            return
        
        self.chunk_count += 1
        chunk = np.asarray(chunk, dtype=np.float32)
        
        # Compute energy
        energy = compute_energy(chunk)
        self.energy_buffer.append(energy)
        self.all_energy_values.append(energy)
        
        print(f"[Chunk {self.chunk_count}] Energy: {energy:.2f} dB")
        
        # Calibrate noise floor from first chunks
        if self.noise_floor is None and len(self.energy_buffer) >= 5:
            # Use minimum energy as noise floor (most conservative)
            self.noise_floor = float(np.min(list(self.energy_buffer)))
            print(f"✅ Noise floor calibrated: {self.noise_floor:.2f} dB")
        
        if self.noise_floor is None:
            return
        
        # SUPER LENIENT: Any energy above noise floor = speech
        speaking = bool(energy > self.noise_floor + 2)  # Only 2dB above noise floor
        self.voiced_buffer.append(speaking)
        
        print(f"  Speaking: {speaking}, Voiced: {len(self.voiced_buffer)}, Pauses: {len(self.recent_pauses)}, Pitch: {len(self.pitch_buffer)}")
        
        # Track pauses
        now = time.time()
        
        if self.is_speaking and not speaking:
            self.pause_start = now
            print(f"  -> PAUSE START")
        elif not self.is_speaking and speaking and self.pause_start is not None:
            pause_duration = now - self.pause_start
            # SUPER LENIENT: Any pause >= 100ms
            if pause_duration >= 0.1:
                self.recent_pauses.append(pause_duration)
                print(f"  -> PAUSE RECORDED: {pause_duration:.3f}s")
            self.pause_start = None
        
        self.is_speaking = speaking
        
        # Extract pitch - SUPER LENIENT
        if speaking and energy > self.noise_floor + 5:
            pitch = estimate_pitch_fft(chunk, self.sample_rate)
            if pitch > 0:
                self.pitch_buffer.append(pitch)
                print(f"  -> PITCH: {pitch:.1f} Hz")
    
    def features_ready(self) -> bool:
        """Check if ready to extract features - SUPER LENIENT"""
        print(f"\n🔍 Checking features:")
        print(f"   Chunks: {len(self.voiced_buffer)}/3")
        print(f"   Pauses: {len(self.recent_pauses)}/0")
        print(f"   Pitch: {len(self.pitch_buffer)}/2")
        print(f"   Noise floor: {self.noise_floor}")
        
        # SUPER LENIENT: Only need 3 chunks (1.5 seconds)
        if len(self.voiced_buffer) < 3:
            print(f"   ❌ Need at least 3 chunks")
            return False
        
        # SUPER LENIENT: Don't even need pauses
        # Just need some voiced frames
        if sum(self.voiced_buffer) < 1:
            print(f"   ❌ No voiced frames detected")
            return False
        
        # SUPER LENIENT: Need just 2 pitch samples
        if len(self.pitch_buffer) < 2:
            print(f"   ⚠️ Few pitch samples ({len(self.pitch_buffer)}), but continuing...")
            # Don't fail just for pitch
        
        if self.noise_floor is None:
            print(f"   ❌ Noise floor not set")
            return False
        
        try:
            self.extract_features()
            print(f"   ✅ READY!")
            return True
        except Exception as e:
            print(f"   ❌ Error: {e}")
            import traceback
            traceback.print_exc()
            return False
    
    def extract_features(self):
        """Extract 5 ML-ready features"""
        print(f"\n📊 Extracting features:")
        
        # FEATURE 1: Pause Frequency
        pause_freq = len(self.recent_pauses) / self.analysis_window * 60 if len(self.recent_pauses) > 0 else 0.0
        
        # FEATURE 2: Average Pause Duration
        avg_pause = float(np.mean(list(self.recent_pauses))) if len(self.recent_pauses) > 0 else 0.0
        
        # FEATURE 3: Silence Ratio
        voiced_count = sum(self.voiced_buffer)
        total_count = len(self.voiced_buffer)
        silence_ratio = 1.0 - (voiced_count / total_count) if total_count > 0 else 0.5
        
        # FEATURE 4: Speech Rate (transitions)
        if len(self.voiced_buffer) > 1:
            voiced_list = list(self.voiced_buffer)
            transitions = sum(1 for i in range(len(voiced_list)-1) 
                            if voiced_list[i] != voiced_list[i+1])
            speech_rate = max(0, transitions * 60 / self.analysis_window / 3)
        else:
            speech_rate = 0.0
        
        # FEATURE 5: Pitch Standard Deviation
        if len(self.pitch_buffer) >= 2:
            pitch_std = float(np.std(list(self.pitch_buffer)))
        else:
            pitch_std = 0.0
        
        print(f"  pause_freq: {pause_freq:.2f}")
        print(f"  avg_pause: {avg_pause:.3f}")
        print(f"  silence_ratio: {silence_ratio:.3f}")
        print(f"  speech_rate: {speech_rate:.2f}")
        print(f"  pitch_std: {pitch_std:.2f}")
        
        # Create raw feature vector
        raw_features = np.array(
            [pause_freq, avg_pause, silence_ratio, speech_rate, pitch_std], 
            dtype=np.float32
        )
        
        # Clip features to bounds
        clipped_features = np.array([
            np.clip(
                raw_features[i], 
                FEATURE_BOUNDS[FEATURE_NAMES[i]][0], 
                FEATURE_BOUNDS[FEATURE_NAMES[i]][1]
            )
            for i in range(len(raw_features))
        ], dtype=np.float32)
        
        print(f"  ✅ Extracted!")
        return clipped_features, raw_features
    
    def reset(self):
        """Reset all buffers"""
        print(f"\n🔄 Resetting engine")
        self.voiced_buffer.clear()
        self.pitch_buffer.clear()
        self.recent_pauses.clear()
        self.energy_buffer.clear()
        self.all_energy_values.clear()
        self.is_speaking = False
        self.pause_start = None
        self.noise_floor = None
        self.chunk_count = 0