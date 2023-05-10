from typing import Union, List
import yaml
import pickle
import json
import numpy as np
import pandas as pd
from ._find_singular_file_in_dir import _find_singular_file_in_dir


def auto_detect_vocalizations(session: str, output_json_fname: str):
    dirname = f'./{session}'
    with open(f'{dirname}/isa-session.yaml', 'r') as f:
        config = yaml.safe_load(f)
    
    try:
        csv_fname = _find_singular_file_in_dir(dirname, ['.csv'])
    except:
        csv_fname = None

    if csv_fname is not None:
        print(f'Generating annotations.json from {csv_fname}')
        csv_path = f'{dirname}/{csv_fname}'
        annotations = _generate_annotations_from_csv(csv_path, sampling_frequency=config['audio_sr_hz'])
        with open(output_json_fname, 'w') as f:
            json.dump(annotations, f, indent=4)
        return

    auto_detect_freq_range = config['auto_detect_freq_range']
    spectrogram_df = config['spectrogram_df']
    freq_range=[int(auto_detect_freq_range[0] / spectrogram_df), int(auto_detect_freq_range[1] / spectrogram_df)]

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

def _generate_annotations_from_csv(csv_fname: str, *, sampling_frequency: float):
    # read in the csv file
    x = pd.read_csv(csv_fname, header=None)

    vocalizations = []
    for r in range(len(x[0])):
        vocalization = {
            "vocalizationId": f"{r}",
            "startFrame": int(x[0][r] * sampling_frequency),
            "endFrame": int(x[1][r] * sampling_frequency),
            "labels": []
        }
        vocalizations.append(vocalization)
    
    annotations = {
        "samplingFrequency": sampling_frequency,
        "vocalizations": vocalizations
    }
    
    return annotations