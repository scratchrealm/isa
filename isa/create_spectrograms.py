from typing import List
import os
import yaml
import h5py
import shutil
import numpy as np
import zarr
from scipy.io import wavfile
from matplotlib.pyplot import specgram
import pickle
from .init import _find_singular_file_in_dir
from ._project_config import _set_session_config_value


def create_spectrograms(session: str):
    dirname = f'./{session}'
    with open(f'{dirname}/isa-session.yaml', 'r') as f:
        config = yaml.safe_load(f)
    print('USING CONFIG')
    print(config)

    spectrograms_pkl_fname = f'{dirname}/spectrograms.pkl'
    spectrogram_for_gui_zarr_fname = f'{dirname}/spectrogram_for_gui.zarr'

    duration_sec = config['audio_duration_sec']
    audio_sr_hz = config['audio_sr_hz']

    # freq_range=[130, 230]

    # # between 0 and 100... percentile cutoff in the target freq band
    # # in spectrogram_for_gui
    # # everything below the value is set to zero
    # # affects detection and compressed file size
    # threshold_pct = 99.8
    
    audio_fname = _find_singular_file_in_dir(dirname, ['.h5', '.wav'])
    if audio_fname is None:
        raise Exception(f'No .h5 or .wav file found in directory: {dirname}')
    print(f'USING AUDIO: {audio_fname}')
    audio_path = f'{dirname}/{audio_fname}'

    print('Extracting audio signals')
    if audio_path.endswith('.h5') is not None:
        with h5py.File(audio_path, 'r') as f:
            ch1 = np.array(f['ai_channels/ai0'])
            ch2 = np.array(f['ai_channels/ai1'])
            ch3 = np.array(f['ai_channels/ai2'])
            ch4 = np.array(f['ai_channels/ai3'])
            X = np.stack([ch1, ch2, ch3, ch4]).T

            # crop to duration
            X = X[0:int(duration_sec * audio_sr_hz)]
    elif audio_path.endswith('.wav'):
        sr, audio = wavfile.read(audio_path)
        # n_samples = audio.shape[0]
        # n_channels = audio.shape[1]
        # crop to duration
        X = audio[0:int(duration_sec * audio_sr_hz)]
    else:
        raise Exception(f'Unknown audio file type: {audio_path}')
    
    num_channels = X.shape[1]

    print('Computing spectrograms')
    spectrograms = []
    for channel_ind in range(num_channels):
        s, spectrogram_frequencies, spectrogram_times, im = specgram(X[:, channel_ind], NFFT=512, noverlap=256, Fs=audio_sr_hz)
        sr_spectrogram = float(1 / (spectrogram_times[1] - spectrogram_times[0]))
        spectrograms.append(s.T) # Use transpose so we have Nt x Nf
    print(f'Spectrogram sampling rate (Hz): {sr_spectrogram}')
    _set_session_config_value(session, 'spectrogram_sr_hz', sr_spectrogram)
    _set_session_config_value(session, 'spectrogram_num_frequencies', len(spectrogram_frequencies))
    spectrogram_for_gui = sum(spectrograms)

    print('Auto detecting maxval')
    maxval = _auto_detect_spectrogram_maxval(spectrogram_for_gui, sr_spectrogram=sr_spectrogram)
    minval = 0
    print(f'Absolute spectrogram max: {np.max(spectrogram_for_gui)}')
    print(f'Auto detected spectrogram max: {maxval}')

    print('Scaling spectogram data')
    # Nf x Nt
    spectrogram_for_gui: np.ndarray = np.floor((spectrogram_for_gui - minval) / (maxval - minval) * 255).astype(np.uint8)

    # threshold = np.percentile(spectrogram_for_gui[freq_range[0]:freq_range[1]], threshold_pct)
    # print(f'Using threshold: {threshold} ({threshold_pct} pct)')
    # spectrogram_for_gui[spectrogram_for_gui <= threshold] = 0

    if os.path.exists(spectrogram_for_gui_zarr_fname):
        shutil.rmtree(spectrogram_for_gui_zarr_fname)
    
    if os.path.exists(spectrograms_pkl_fname):
        os.remove(spectrograms_pkl_fname)

    print(f'Writing {spectrograms_pkl_fname}')
    with open(spectrograms_pkl_fname, 'wb') as fb:
        pickle.dump({
            'spectrograms': spectrograms,
            'frequencies': spectrogram_frequencies,
            'times': spectrogram_times,
            'spectrogram_for_gui': spectrogram_for_gui
        }, fb)
    
    print(f'Writing {spectrogram_for_gui_zarr_fname}')
    root_group = zarr.open(spectrogram_for_gui_zarr_fname, mode="w")
    root_group.create_dataset("spectrogram", data=spectrogram_for_gui, chunks=(10000, len(spectrogram_frequencies)))
    root_group.attrs['spectrogram_sr_hz'] = sr_spectrogram
    root_group.create_dataset("frequencies", data=spectrogram_frequencies)
    root_group.create_dataset("times", data=spectrogram_times)

def _auto_detect_spectrogram_maxval(spectrogram: np.array, *, sr_spectrogram: float):
    Nt = spectrogram.shape[0]
    Nf = spectrogram.shape[1]
    chunk_num_samples = int(15 * sr_spectrogram)
    chunk_maxvals: List[float] = []
    i = 0
    while i + chunk_num_samples < Nt:
        chunk = spectrogram[i:i + chunk_num_samples]
        chunk_maxvals.append(np.max(chunk))
        i += chunk_num_samples
    v = np.median(chunk_maxvals)
    return v
