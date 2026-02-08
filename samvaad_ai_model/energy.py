import numpy as np
def compute_energy(audio):
    """Compute RMS energy in dB"""
    rms = np.sqrt(np.mean(audio ** 2))
    return 20 * np.log10(rms + 1e-10)