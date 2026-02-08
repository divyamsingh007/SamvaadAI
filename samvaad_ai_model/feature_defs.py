FEATURE_NAMES = [
    "pause_freq",
    "avg_pause",
    "silence_ratio",
    "speech_rate",
    "pitch_std"
]

FEATURE_BOUNDS = {
    "pause_freq": (0, 150),
    "avg_pause": (0, 2.0),
    "silence_ratio": (0, 0.95),
    "speech_rate": (0, 35),
    "pitch_std": (0, 25)
}
