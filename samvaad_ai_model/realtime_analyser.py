import numpy as np
import joblib
import queue
import time
import sounddevice as sd
from collections import deque
from scipy import signal
import pandas as pd

FEATURE_NAMES = [
    "pause_freq",
    "avg_pause",
    "silence_ratio",
    "speech_rate",
    "pitch_std"
]

FEATURE_BOUNDS = {
    'pause_freq': (0, 150),
    'avg_pause': (0, 2.0),
    'silence_ratio': (0, 0.95),
    'speech_rate': (0, 35),
    'pitch_std': (0, 25)
}

SCORING_PROFILES = {
    'delivery_fluency': {
        'name': 'Delivery Fluency (Default)',
        'weights': {
            'pause_freq': -0.25,
            'avg_pause': -0.20,
            'silence_ratio': -0.25,
            'speech_rate': 0.20,
            'pitch_std': -0.10
        }
    },

    'vocal_stability': {
        'name': 'Vocal Stability',
        'weights': {
            'pause_freq': -0.05,
            'avg_pause': -0.05,
            'silence_ratio': 0.0,
            'speech_rate': 0.0,
            'pitch_std': -0.90
        }
    },

    'content_focus': {
        'name': 'Content-Focused Speaking',
        'weights': {
            'pause_freq': -0.10,
            'avg_pause': 0.0,
            'silence_ratio': -0.80,
            'speech_rate': 0.0,
            'pitch_std': -0.10
        }
    },

    'presence': {
        'name': 'Presence & Clarity',
        'weights': {
            'pause_freq': -0.15,
            'avg_pause': -0.10,
            'silence_ratio': -0.30,
            'speech_rate': 0.10,
            'pitch_std': 0.0
        }
    },

    'balanced': {
        'name': 'Balanced Assessment',
        'weights': {
            'pause_freq': -0.20,
            'avg_pause': -0.15,
            'silence_ratio': -0.25,
            'speech_rate': 0.15,
            'pitch_std': -0.05
        }
    },

    'custom': {
        'name': 'Custom (Define Your Own)',
        'weights': {
            'pause_freq': -0.20,
            'avg_pause': -0.15,
            'silence_ratio': -0.25,
            'speech_rate': 0.15,
            'pitch_std': -0.05
        }
    }
}


class RealtimeMLConfidence:

    def __init__(self, model_path="confidence_model.pkl", scoring_profile='delivery_fluency'):
        self.model = joblib.load(model_path)
        self.scoring_profile = scoring_profile
        self.profile_config = SCORING_PROFILES[scoring_profile]

        self.sample_rate = 16000
        self.chunk_duration = 0.5
        self.chunk_size = int(self.sample_rate * self.chunk_duration)
        self.analysis_window = 5.0

        max_chunks = int(self.analysis_window / self.chunk_duration)

        self.voiced_buffer = deque(maxlen=max_chunks)
        self.pitch_buffer = deque(maxlen=30)
        self.recent_pauses = deque(maxlen=20)

        self.energy_buffer = deque(maxlen=10)
        self.noise_floor = None

        self.is_speaking = False
        self.pause_start = None

        self.prev_conf = None
        self.smoothing_alpha = 0.4

        self.audio_queue = queue.Queue()

    def audio_callback(self, indata, frames, time_info, status):
        self.audio_queue.put(indata.copy())

    def compute_energy(self, audio):
        rms = np.sqrt(np.mean(audio ** 2))
        return 20 * np.log10(rms + 1e-10)

    def estimate_pitch_fft(self, audio):
        if len(audio) < 512:
            return 0.0

        audio = audio.astype(float)
        audio -= np.mean(audio)

        if len(audio) > 4096:
            audio = signal.resample(audio, 4096)

        window = np.hamming(len(audio))
        audio_windowed = audio * window

        freqs = np.fft.rfftfreq(len(audio_windowed), 1.0 / self.sample_rate)
        spectrum = np.abs(np.fft.rfft(audio_windowed))

        min_freq = 50
        max_freq = 320

        freq_mask = (freqs >= min_freq) & (freqs <= max_freq)

        if not np.any(freq_mask):
            return 0.0

        masked_spectrum = spectrum[freq_mask]
        masked_freqs = freqs[freq_mask]

        if len(masked_spectrum) == 0:
            return 0.0

        peak_idx = np.argmax(masked_spectrum)
        peak_freq = masked_freqs[peak_idx]
        peak_power = masked_spectrum[peak_idx]

        avg_power = np.mean(masked_spectrum)
        power_ratio = peak_power / (avg_power + 1e-10)

        if power_ratio < 3.0:
            return 0.0

        if peak_freq > 100:
            half_freq = peak_freq / 2.0
            half_mask = np.abs(freqs - half_freq) < 2
            if np.any(half_mask):
                half_power = spectrum[half_mask].max() if np.any(half_mask) else 0
                if half_power > 0.7 * peak_power:
                    peak_freq = half_freq

        if min_freq <= peak_freq <= max_freq:
            return peak_freq

        return 0.0

    def extract_features(self):
        pause_freq = len(self.recent_pauses) / self.analysis_window * 60
        avg_pause = np.mean(self.recent_pauses) if self.recent_pauses else 0.0

        silence_ratio = (
            1.0 - sum(self.voiced_buffer) / len(self.voiced_buffer)
            if len(self.voiced_buffer) > 0
            else 0.0
        )

        speech_rate = (
            np.sum(np.diff(self.voiced_buffer) == 1)
            * 60 / self.analysis_window / 3
            if len(self.voiced_buffer) > 1
            else 0.0
        )

        pitch_std = np.std(self.pitch_buffer) if len(self.pitch_buffer) > 5 else 0.0

        raw_features = np.array([
            pause_freq,
            avg_pause,
            silence_ratio,
            speech_rate,
            pitch_std
        ])

        bounds = [
            FEATURE_BOUNDS['pause_freq'],
            FEATURE_BOUNDS['avg_pause'],
            FEATURE_BOUNDS['silence_ratio'],
            FEATURE_BOUNDS['speech_rate'],
            FEATURE_BOUNDS['pitch_std']
        ]

        clipped_features = np.array([
            np.clip(raw_features[i], bounds[i][0], bounds[i][1])
            for i in range(len(raw_features))
        ])

        return clipped_features, raw_features

    def features_ready(self):
        if len(self.voiced_buffer) != self.voiced_buffer.maxlen:
            return False

        if len(self.recent_pauses) < 2:
            return False

        if len(self.pitch_buffer) < 15:
            return False

        feats, _ = self.extract_features()
        silence_ratio = feats[2]
        speech_rate = feats[3]

        if silence_ratio > 0.8:
            return False

        if speech_rate < 1.0 and len(self.pitch_buffer) < 20:
            return False

        return True

    def calculate_custom_score(self, features):
        normalized = np.array([
            (features[0] - FEATURE_BOUNDS['pause_freq'][0]) / (FEATURE_BOUNDS['pause_freq'][1] - FEATURE_BOUNDS['pause_freq'][0]),
            (features[1] - FEATURE_BOUNDS['avg_pause'][0]) / (FEATURE_BOUNDS['avg_pause'][1] - FEATURE_BOUNDS['avg_pause'][0]),
            (features[2] - FEATURE_BOUNDS['silence_ratio'][0]) / (FEATURE_BOUNDS['silence_ratio'][1] - FEATURE_BOUNDS['silence_ratio'][0]),
            (features[3] - FEATURE_BOUNDS['speech_rate'][0]) / (FEATURE_BOUNDS['speech_rate'][1] - FEATURE_BOUNDS['speech_rate'][0]),
            (features[4] - FEATURE_BOUNDS['pitch_std'][0]) / (FEATURE_BOUNDS['pitch_std'][1] - FEATURE_BOUNDS['pitch_std'][0])
        ])

        normalized = np.clip(normalized, 0, 1)

        weights = np.array([
            self.profile_config['weights']['pause_freq'],
            self.profile_config['weights']['avg_pause'],
            self.profile_config['weights']['silence_ratio'],
            self.profile_config['weights']['speech_rate'],
            self.profile_config['weights']['pitch_std']
        ])

        inverted = np.array([
            1 - normalized[0],
            1 - normalized[1],
            1 - normalized[2],
            normalized[3],
            1 - normalized[4]
        ])

        weighted_score = np.dot(inverted, np.abs(weights))

        total_weight = np.sum(np.abs(weights))
        confidence = (weighted_score / total_weight) * 100 if total_weight > 0 else 0

        return np.clip(confidence, 0, 100)

    def start(self):
        stream = sd.InputStream(
            samplerate=self.sample_rate,
            channels=1,
            blocksize=self.chunk_size,
            callback=self.audio_callback
        )
        stream.start()

        print(f"Profile: {self.profile_config['name']}")
        print("Waiting for valid speech window...\n")

        try:
            inference_count = 0
            while True:
                audio = self.audio_queue.get().flatten()
                energy = self.compute_energy(audio)
                self.energy_buffer.append(energy)

                if self.noise_floor is None and len(self.energy_buffer) >= 10:
                    self.noise_floor = np.median(self.energy_buffer)
                    continue

                if self.noise_floor is None:
                    continue

                speaking = energy > self.noise_floor + 10
                self.voiced_buffer.append(speaking)

                now = time.time()

                if self.is_speaking and not speaking:
                    self.pause_start = now
                elif not self.is_speaking and speaking and self.pause_start:
                    duration = now - self.pause_start
                    if duration >= 0.4:
                        self.recent_pauses.append(duration)
                    self.pause_start = None

                self.is_speaking = speaking

                if speaking and energy > self.noise_floor + 15:
                    pitch = self.estimate_pitch_fft(audio)
                    if pitch > 0:
                        self.pitch_buffer.append(pitch)

                if self.features_ready():
                    feats_clipped, feats_raw = self.extract_features()

                    inference_count += 1

                    x = pd.DataFrame([feats_clipped], columns=FEATURE_NAMES)
                    model_pred = self.model.predict(x)[0]
                    model_pred_clamped = np.clip(model_pred, 1.0, 5.0)
                    model_conf_raw = (model_pred_clamped - 1.0) / 4.0 * 100.0

                    custom_conf_raw = self.calculate_custom_score(feats_clipped)

                    if self.prev_conf is None:
                        custom_conf = custom_conf_raw
                    else:
                        custom_conf = (
                            (1 - self.smoothing_alpha) * self.prev_conf +
                            self.smoothing_alpha * custom_conf_raw
                        )

                    custom_conf = float(np.clip(custom_conf, 0.0, 100.0))
                    self.prev_conf = custom_conf

                    print(f"\n{'='*70}")
                    print(f"INFERENCE #{inference_count}")
                    print(f"{'='*70}")

                    print(f"\nFeatures:")
                    print(f"  pause_freq:    {feats_clipped[0]:7.1f}")
                    print(f"  avg_pause:     {feats_clipped[1]:7.2f}s")
                    print(f"  silence_ratio: {feats_clipped[2]:7.2%}")
                    print(f"  speech_rate:   {feats_clipped[3]:7.1f}")
                    print(f"  pitch_std:     {feats_clipped[4]:7.2f}Hz")

                    print(f"\n{'='*70}")
                    print(f"SCORE: {custom_conf:.1f}%")
                    print(f"{'='*70}")
                    print(f"Profile: {self.profile_config['name']}")

                    if custom_conf >= 70:
                        print(f"Rating: EXCELLENT")
                    elif custom_conf >= 50:
                        print(f"Rating: GOOD")
                    elif custom_conf >= 30:
                        print(f"Rating: FAIR")
                    else:
                        print(f"Rating: NEEDS WORK")

                    print(f"\n(Model-based reference: {model_conf_raw:.1f}%)")

                else:
                    status_parts = []

                    if len(self.voiced_buffer) < self.voiced_buffer.maxlen:
                        status_parts.append(
                            f"Voice[{len(self.voiced_buffer)}/{self.voiced_buffer.maxlen}]"
                        )

                    if len(self.recent_pauses) < 2:
                        status_parts.append(f"Pauses[{len(self.recent_pauses)}/2]")

                    if len(self.pitch_buffer) < 15:
                        status_parts.append(f"Pitch[{len(self.pitch_buffer)}/15]")

                    status = " ".join(status_parts)
                    print(f"Initializing... {status}\r", end="", flush=True)

        except KeyboardInterrupt:
            stream.stop()
            stream.close()
            print("\nStopped.")


if __name__ == "__main__":
    import sys

    profile = 'balanced'
    if len(sys.argv) > 1:
        profile = sys.argv[1]

    if profile not in SCORING_PROFILES:
        print("Available profiles:")
        for key, config in SCORING_PROFILES.items():
            print(f"  {key:20s} - {config['name']}")
        print(f"\nUsage: python script.py [profile_name]")
        sys.exit(1)

    RealtimeMLConfidence(scoring_profile=profile).start()