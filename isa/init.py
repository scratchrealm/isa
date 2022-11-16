import os
import h5py
import yaml
import json
from typing import List
import numpy as np


def init():
    gitignore_fname = '.gitignore'
    isa_project_yaml_fname = 'isa-project.yaml'
    if os.path.exists(gitignore_fname):
        raise Exception(f'File already exists: {gitignore_fname}')
    if os.path.exists(isa_project_yaml_fname):
        raise Exception(f'File already exists: {isa_project_yaml_fname}')
    
    session_names: List[str] = []
    names = os.listdir('.')
    for session_name in names:
        if os.path.isdir(session_name):
            if not session_name.startswith('.'):
                print('====================================================')
                print(f'INITIALIZING SESSION: {session_name}')
                _initialize_session_dir(f'./{session_name}')
                session_names.append(session_name)
    
    if os.path.exists(isa_project_yaml_fname):
        with open(isa_project_yaml_fname, 'r') as f:
            project_config = yaml.safe_load(f)
    else:
        project_config = {}
    
    project_config['sessions'] = session_names
    if 'repository_url' not in project_config:
        project_config['repository_url'] = 'https://github.com/<user>/<repo>'
    if 'use_singularity_for_ffmpeg' not in project_config:
        project_config['use_singularity_for_ffmpeg'] = False
    
    with open(isa_project_yaml_fname, 'w') as f:
        yaml.dump(project_config, f)
    
    with open(gitignore_fname, 'w') as f:
        f.write('''
*.h5
*.avi
*.ogv
*.npy
*.pkl
''')

def _initialize_session_dir(dirname: str):
    h5_fname = _find_singular_file_in_dir(dirname, '.h5')
    if h5_fname is None:
        raise Exception(f'Cannot find .h5 file in directory: {dirname}')
    print(f'USING H5: {h5_fname}')

    audio_sr_hz = _get_audio_sr_from_h5(h5_fname)
    print(f'Audio sampling rate (Hz): {audio_sr_hz}')

    # get first channel in order to compute duration
    print('Determining duration')
    with h5py.File(h5_fname, 'r') as f:
        ch1 = np.array(f['ai_channels/ai0'])
    duration_sec = len(ch1) / audio_sr_hz
    print(f'Audio duration (sec): {duration_sec}')

    config_yaml_fname = f'{dirname}/isa-session.yaml'

    print(f'Creating or updating {config_yaml_fname}')
    if os.path.exists(config_yaml_fname):
        with open(config_yaml_fname, 'r') as f:
            config = yaml.safe_load(f)
    else:
        config = {}    
    config['dataset_id'] = os.path.basename(dirname)
    config['audio_sr_hz'] = audio_sr_hz
    config['duration_sec'] = duration_sec

    with open(config_yaml_fname, 'w') as f:
        yaml.dump(config, f)

def _get_audio_sr_from_h5(h5_file: str):
    with h5py.File(h5_file, 'r') as f:
        d = json.loads(f['config'][()].decode('utf-8'))
        audio_sr_hz = d['microphone_sample_rate']
    return audio_sr_hz

def _find_singular_file_in_dir(dirname: str, extension: str):
    fnames = os.listdir(dirname)
    f_fnames = [f for f in fnames if f.endswith(extension)]
    if len(f_fnames) == 0:
        return None
    if len(f_fnames) > 1:
        raise Exception(f'More than one {extension} file found in directory: {dirname}')
    return f'{dirname}/{f_fnames[0]}'
