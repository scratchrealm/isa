import os
import h5py
import yaml
import json
import cv2
from scipy.io import wavfile
from typing import List
import numpy as np
from ._find_singular_file_in_dir import _find_singular_file_in_dir
from ._project_config import _get_project_config_value, _set_project_config_value


def init():
    session_names_in_yaml = _get_project_config_value('sessions')
    if session_names_in_yaml is None:
        session_names: List[str] = []
        names = os.listdir('.')
        for session_name in names:
            if os.path.isdir(session_name):
                if not session_name.startswith('.'):
                    session_names.append(session_name)
        _set_project_config_value('sessions', session_names)
    else:
        session_names = session_names_in_yaml
    for session_name in session_names:
        print('====================================================')
        print(f'SESSION: {session_name}')
        try:
            _initialize_or_update_session_dir(session_name)
        except Exception as e:
            print(f'Failed to initialize session: {session_name}: {e}')
            print('See isa-project.yaml for list of sessions. You can remove the session from the list and try again.')
            print('Aborting.')
            return
        print('')

def _initialize_or_update_session_dir(session: str):
    dirname = f'./{session}'
    config_yaml_fname = f'{dirname}/isa-session.yaml'
    if os.path.exists(config_yaml_fname):
        with open(config_yaml_fname, 'r') as f:
            config = yaml.safe_load(f)
    else:
        config = {}
    
    ##########################################
    # AUDIO
    audio_fname = _find_singular_file_in_dir(dirname, ['.h5', '.wav'])
    if audio_fname is None:
        raise Exception(f'Cannot find .h5 or .wav file in directory: {dirname}')
    print(f'USING AUDIO: {audio_fname}')
    config['audio_fname'] = audio_fname
    audio_path = f'{dirname}/{audio_fname}'

    if audio_path.endswith('.h5'):
        audio_sr_hz = _get_audio_sr_from_h5(audio_path)
        
        # get first channel in order to compute duration
        with h5py.File(audio_path, 'r') as f:
            ch1 = np.array(f['ai_channels/ai0'])
        audio_duration_sec = len(ch1) / audio_sr_hz
    elif audio_path.endswith('.wav'):
        audio_sr_hz, audio = wavfile.read(audio_path)
        n_samples = audio.shape[0]
        # n_channels = audio.shape[1]
        audio_duration_sec = n_samples / audio_sr_hz
    else:
        raise Exception('Unexpected')

    print(f'Audio sampling rate (Hz): {audio_sr_hz}')
    print(f'Audio duration (sec): {audio_duration_sec}')
    config['audio_sr_hz'] = audio_sr_hz
    config['audio_duration_sec'] = audio_duration_sec
    if not 'auto_detect_freq_range' in config:
        config['auto_detect_freq_range'] = [0, audio_sr_hz / 2]

    ##########################################
    # VIDEO
    video_fname = _find_singular_file_in_dir(dirname, ['.mp4', '.avi'])
    if video_fname is None:
        raise Exception(f'Cannot find .mp4 or .avi file in directory: {dirname}')
    print(f'USING VIDEO: {video_fname}')
    config['video_fname'] = video_fname
    video_path = f'{dirname}/{video_fname}'

    vid = cv2.VideoCapture(video_path)
    width = int(vid.get(cv2.CAP_PROP_FRAME_WIDTH))
    height = int(vid.get(cv2.CAP_PROP_FRAME_HEIGHT))
    fps = vid.get(cv2.CAP_PROP_FPS)
    num_frames = int(vid.get(cv2.CAP_PROP_FRAME_COUNT))
    video_duration_sec = num_frames / fps

    print(f'Video width: {width}')
    print(f'Video height: {height}')
    print(f'Video fps: {fps}')
    config['video_width'] = width
    config['video_height'] = height
    config['video_fps'] = fps
    config['video_duration_sec'] = video_duration_sec
    config['video_num_frames'] = num_frames

    ##########################################
    print(f'Writing {config_yaml_fname}')
    with open(config_yaml_fname, 'w') as f:
        yaml.dump(config, f)
    
    view_yaml_fname = f'{dirname}/view.yaml'
    print(f'Writing {view_yaml_fname}')
    with open(view_yaml_fname, 'w') as f:
        yaml.dump({
            'type': 'figurl',
            'v': 'https://scratchrealm.github.io/isa',
            'label': session
        }, f)

def _get_audio_sr_from_h5(h5_file: str):
    with h5py.File(h5_file, 'r') as f:
        d = json.loads(f['config'][()].decode('utf-8'))
        audio_sr_hz = d['microphone_sample_rate']
    return audio_sr_hz
