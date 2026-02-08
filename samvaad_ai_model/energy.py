import numpy as np


def compute_energy(audio):
    rms = np.sqrt(np.mean(audio ** 2))
    return 20 * np.log10(rms + 1e-10)