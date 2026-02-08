import numpy as np
from scipy import signal


def estimate_pitch_fft(audio, sample_rate=16000):
    if len(audio) < 512:
        return 0.0
    
    audio = np.asarray(audio, dtype=float)
    audio = audio - np.mean(audio)
    
    if len(audio) > 4096:
        audio = signal.resample(audio, 4096)
    
    window = np.hamming(len(audio))
    audio_windowed = audio * window
    
    freqs = np.fft.rfftfreq(len(audio_windowed), 1.0 / sample_rate)
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
    
    if min_freq <= peak_freq <= max_freq:
        return float(peak_freq)
    
    return 0.0