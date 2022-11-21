from typing import List
import os
import yaml
import h5py
import numpy as np
from matplotlib.pyplot import specgram
import pickle
from .init import _find_singular_file_in_dir


def create_spectrograms(dirname: str, output_pkl_fname: str):
    with open(f'{dirname}/isa-session.yaml', 'r') as f:
        config = yaml.safe_load(f)
    print('USING CONFIG')
    print(config)

    duration_sec = config['duration_sec']
    audio_sr_hz = config['audio_sr_hz']

    freq_range=[130, 230]

    # between 0 and 100... percentile cutoff in the target freq band
    # in spectrogram_for_gui
    # everything below the value is set to zero
    # affects detection and compressed file size
    threshold_pct = 95
    
    h5_fname = _find_singular_file_in_dir(dirname, '.h5')
    if h5_fname is None:
        raise Exception(f'No .h5 file found in directory: {dirname}')
    print(f'USING H5: {h5_fname}')

    print('Extracting audio signals')
    with h5py.File(h5_fname, 'r') as f:
        ch1 = np.array(f['ai_channels/ai0'])
        ch2 = np.array(f['ai_channels/ai1'])
        ch3 = np.array(f['ai_channels/ai2'])
        ch4 = np.array(f['ai_channels/ai3'])
        X = np.stack([ch1, ch2, ch3, ch4]).T

        # crop to duration
        X = X[0:int(duration_sec * audio_sr_hz)]

        num_channels = X.shape[1]

    print('Computing spectrograms')
    spectrograms = []
    for channel_ind in range(num_channels):
        s, f, t, im = specgram(X[:, channel_ind], NFFT=512, noverlap=256, Fs=audio_sr_hz)
        sr_spectrogram = 1 / (t[1] - t[0])
        spectrograms.append(s)
    print(f'Spectrogram sampling rate (Hz): {sr_spectrogram}')
    spectrogram_for_gui = sum(spectrograms)

    print('Auto detecting maxval')
    maxval = _auto_detect_spectrogram_maxval(spectrogram_for_gui, sr_spectrogram=sr_spectrogram)
    minval = 0
    print(f'Absolute spectrogram max: {np.max(spectrogram_for_gui)}')
    print(f'Auto detected spectrogram max: {maxval}')

    print('Scaling spectogram data')
    # Nf x Nt
    spectrogram_for_gui = np.floor((spectrogram_for_gui - minval) / (maxval - minval) * 255).astype(np.uint8)

    threshold = np.percentile(spectrogram_for_gui[freq_range[0]:freq_range[1]], threshold_pct)
    print(f'Using threshold: {threshold} ({threshold_pct} pct)')
    spectrogram_for_gui[spectrogram_for_gui <= threshold] = 0

    print(f'Writing {output_pkl_fname}')
    with open(output_pkl_fname, 'wb') as fb:
        pickle.dump({
            'spectrograms': spectrograms,
            'f': f,
            't': t,
            'spectrogram_for_gui': spectrogram_for_gui
        }, fb)

def _auto_detect_spectrogram_maxval(spectrogram: np.array, *, sr_spectrogram: float):
    Nf = spectrogram.shape[0]
    Nt = spectrogram.shape[1]
    chunk_num_samples = int(15 * sr_spectrogram)
    chunk_maxvals: List[float] = []
    i = 0
    while i + chunk_num_samples < Nt:
        chunk = spectrogram[:, i:i + chunk_num_samples]
        chunk_maxvals.append(np.max(chunk))
        i += chunk_num_samples
    v = np.median(chunk_maxvals)
    return v
