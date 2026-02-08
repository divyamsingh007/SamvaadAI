import sounddevice as sd
import numpy as np


class AudioRecorder:

    def __init__(self, sample_rate=16000):
        self.sample_rate = sample_rate

    def record(self, max_duration=15):
        audio = sd.rec(
            int(max_duration * self.sample_rate),
            samplerate=self.sample_rate,
            channels=1,
            dtype="float32",
            blocking=True
        )
        return audio.flatten()