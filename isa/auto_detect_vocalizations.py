from typing import Union
import yaml
import pickle
import json
import numpy as np


def auto_detect_vocalizations(session: str, output_json_fname: str):
    dirname = f'./{session}'
    with open(f'{dirname}/isa-session.yaml', 'r') as f:
        config = yaml.safe_load(f)
    print('USING CONFIG')
    print(config)

    freq_range=[130, 230]

    spectrograms_fname = f'{dirname}/spectrograms.pkl'
    print(f'Loading {spectrograms_fname}')
    with open(spectrograms_fname, 'rb') as f:
        a = pickle.load(f)
    spectrogram_for_gui: np.ndarray = a['spectrogram_for_gui']
    t: np.ndarray = a['times']
    sr_spectrogram = 1 / (t[1] - t[0])

    print(f'Spectrogram sampling rate (Hz): {sr_spectrogram}')

    print('Auto detecting vocalizations')
    auto_vocalizations = _auto_detect_vocalizations(spectrogram_for_gui[:, freq_range[0]:freq_range[1]], sampling_frequency=sr_spectrogram)

    annotations = {
        'samplingFrequency': sr_spectrogram,
        'vocalizations': auto_vocalizations
    }

    with open(output_json_fname, 'w') as f:
        json.dump(annotations, f, indent=4)

def _auto_detect_vocalizations(spectrogram: np.array, *, sampling_frequency: float):
    threshold_pct = 99.8
    threshold = np.percentile(spectrogram, threshold_pct)
    spectrogram = np.copy(spectrogram)
    spectrogram[spectrogram < threshold] = 0

    vocalizations = []
    max_gap = 20
    min_size = 10
    voc_ind = 0
    a = np.max(spectrogram, axis=1)
    vocalization_start_frame: Union[int, None] = None
    vocalization_last_active_frame: Union[int, None] = None
    for i in range(len(a)):
        if a[i] > 0:
            # non-zero value
            if vocalization_start_frame is None:
                # not in a potential vocalization
                vocalization_start_frame = i
            vocalization_last_active_frame = i
        else:
            # zero value
            if vocalization_last_active_frame is not None:
                # in a potential vocalization
                if i - vocalization_last_active_frame >= max_gap:
                    # it's been long enough since we had a non-zero value
                    if vocalization_last_active_frame - vocalization_start_frame >= min_size:
                        # the vocalization was long enough
                        vocalizations.append(
                            {'vocalizationId': f'auto-{voc_ind}', 'startFrame': vocalization_start_frame, 'endFrame': vocalization_last_active_frame + 1, 'labels': ['auto']}
                        )
                        voc_ind = voc_ind + 1
                    vocalization_start_frame = None
                    vocalization_last_active_frame = None
    return vocalizations