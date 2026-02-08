import time
from collections import deque
import numpy as np
from pitch import estimate_pitch_fft
from energy import compute_energy
from audioconfig import SAMPLE_RATE, CHUNK_DURATION, ANALYSIS_WINDOW
from feature_defs import FEATURE_NAMES, FEATURE_BOUNDS


class ConfidenceFeatureEngine:

    def __init__(self, sample_rate=SAMPLE_RATE):
        self.sample_rate = sample_rate
        self.chunk_duration = CHUNK_DURATION
        self.analysis_window = ANALYSIS_WINDOW

        self.chunk_size = int(sample_rate * self.chunk_duration)
        max_chunks = int(self.analysis_window / self.chunk_duration)

        self.voiced_buffer = deque(maxlen=max_chunks)
        self.pitch_buffer = deque(maxlen=30)
        self.recent_pauses = deque(maxlen=20)
        self.energy_buffer = deque(maxlen=10)
        self.all_energy_values = []

        self.is_speaking = False
        self.pause_start = None
        self.noise_floor = None
        self.chunk_count = 0

    def process_chunk(self, chunk):
        if chunk is None or len(chunk) == 0:
            return

        self.chunk_count += 1
        chunk = np.asarray(chunk, dtype=np.float32)

        energy = compute_energy(chunk)
        self.energy_buffer.append(energy)
        self.all_energy_values.append(energy)

        if self.noise_floor is None and len(self.energy_buffer) >= 5:
            self.noise_floor = float(np.min(list(self.energy_buffer)))

        if self.noise_floor is None:
            return

        speaking = bool(energy > self.noise_floor + 2)
        self.voiced_buffer.append(speaking)

        now = time.time()

        if self.is_speaking and not speaking:
            self.pause_start = now
        elif not self.is_speaking and speaking and self.pause_start is not None:
            pause_duration = now - self.pause_start
            if pause_duration >= 0.1:
                self.recent_pauses.append(pause_duration)
            self.pause_start = None

        self.is_speaking = speaking

        if speaking and energy > self.noise_floor + 5:
            pitch = estimate_pitch_fft(chunk, self.sample_rate)
            if pitch > 0:
                self.pitch_buffer.append(pitch)

    def features_ready(self) -> bool:
        if len(self.voiced_buffer) < 3:
            return False

        if sum(self.voiced_buffer) < 1:
            return False

        if self.noise_floor is None:
            return False

        try:
            self.extract_features()
            return True
        except Exception:
            return False

    def extract_features(self):
        pause_freq = len(self.recent_pauses) / self.analysis_window * 60 if len(self.recent_pauses) > 0 else 0.0

        avg_pause = float(np.mean(list(self.recent_pauses))) if len(self.recent_pauses) > 0 else 0.0

        voiced_count = sum(self.voiced_buffer)
        total_count = len(self.voiced_buffer)
        silence_ratio = 1.0 - (voiced_count / total_count) if total_count > 0 else 0.5

        if len(self.voiced_buffer) > 1:
            voiced_list = list(self.voiced_buffer)
            transitions = sum(1 for i in range(len(voiced_list)-1)
                            if voiced_list[i] != voiced_list[i+1])
            speech_rate = max(0, transitions * 60 / self.analysis_window / 3)
        else:
            speech_rate = 0.0

        if len(self.pitch_buffer) >= 2:
            pitch_std = float(np.std(list(self.pitch_buffer)))
        else:
            pitch_std = 0.0

        raw_features = np.array(
            [pause_freq, avg_pause, silence_ratio, speech_rate, pitch_std],
            dtype=np.float32
        )

        clipped_features = np.array([
            np.clip(
                raw_features[i],
                FEATURE_BOUNDS[FEATURE_NAMES[i]][0],
                FEATURE_BOUNDS[FEATURE_NAMES[i]][1]
            )
            for i in range(len(raw_features))
        ], dtype=np.float32)

        return clipped_features, raw_features

    def reset(self):
        self.voiced_buffer.clear()
        self.pitch_buffer.clear()
        self.recent_pauses.clear()
        self.energy_buffer.clear()
        self.all_energy_values.clear()
        self.is_speaking = False
        self.pause_start = None
        self.noise_floor = None
        self.chunk_count = 0