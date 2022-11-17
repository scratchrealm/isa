from typing import Union
import os
import kachery_cloud as kcl
import yaml
import pickle
import numpy as np
from figurl.core.serialize_wrapper import _serialize


def auto_detect_vocalizations(dirname: str, output_uri_fname: str):
    with open(f'{dirname}/isa-session.yaml', 'r') as f:
        config = yaml.safe_load(f)
    print('USING CONFIG')
    print(config)

    output_fname = f'{dirname}/annotations.uri'
    if os.path.exists(output_fname):
        raise Exception(f'File already exists: {output_fname}')

    spectrograms_fname = f'{dirname}/spectrograms.pkl'
    print(f'Loading {spectrograms_fname}')
    with open(spectrograms_fname, 'rb') as f:
        a = pickle.load(f)
    spectrogram_for_gui: np.ndarray = a['spectrogram_for_gui']
    t: np.ndarray = a['t']
    sr_spectrogram = 1 / (t[1] - t[0])

    print(f'Spectrogram sampling rate (Hz): {sr_spectrogram}')

    print('Auto detecting vocalizations')
    auto_vocalizations = _auto_detect_vocalizations(spectrogram_for_gui[130:230], sampling_frequency=sr_spectrogram)

    annotations = {
        'samplingFrequency': sr_spectrogram,
        'vocalizations': auto_vocalizations
    }

    print('Storing annotations in kachery')
    annotations_uri = kcl.store_json(_serialize(annotations, compress_npy=True))

    print(f'Writing {output_uri_fname}')
    with open(output_uri_fname, 'w') as f:
        f.write(annotations_uri)

def _auto_detect_vocalizations(spectrogram: np.array, *, sampling_frequency: float):
    vocalizations = []
    max_gap = 20
    min_size = 10
    voc_ind = 0
    a = np.max(spectrogram, axis=0)
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