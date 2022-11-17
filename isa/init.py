import os
import h5py
import yaml
import json
import click
from typing import List
import numpy as np
from ._find_singular_file_in_dir import _find_singular_file_in_dir
from ._project_config import _get_project_config_value, _set_project_config_value


def init():
    # initialize git repository
    if os.path.exists('.git'):
        if not click.confirm('This project has already been initialized as a git repo. Proceed?', default=True):
            return
        need_to_check_repo_url = True
    else:
        if click.confirm('Initialize git repository?', default=True):
            os.system('git init')
            need_to_check_repo_url = True
        else:
            need_to_check_repo_url = False
    
    if need_to_check_repo_url:
        repo_url = _get_project_config_value('repository_url')
        if repo_url is not None:
            print(f'Using repository: {repo_url}')
        else:
            repo_url = click.prompt('Create a new repository on GitHub with a name like isa-project-1 and enter the url (e.g., https://github.com/user/isa-project-1). Or leave empty to skip this step.', default='', type=str)
            if repo_url:
                _set_project_config_value('repository_url', repo_url)
    
    # Create .gitignore
    gitignore_fname = '.gitignore'
    if os.path.exists(gitignore_fname):
        do_write_gitignore = click.confirm('.gitignore file already exists. Overwrite?', default=False)
    else:
        do_write_gitignore = True
    if do_write_gitignore:
        print('Creating .gitignore')
        with open(gitignore_fname, 'w') as f:
            f.write('''
# ignore everything by default, but do traverse directories
*
!*/

# whitelist
!.gitignore
!*.yaml
!*.uri
!*.url
!*.md
''')
    
    session_names_in_yaml = _get_project_config_value('sessions')
    if session_names_in_yaml is None:
        session_names: List[str] = []
        names = os.listdir('.')
        for session_name in names:
            if os.path.isdir(session_name):
                if not session_name.startswith('.'):
                    print('====================================================')
                    print(f'INITIALIZING SESSION: {session_name}')
                    _initialize_session_dir(f'./{session_name}')
                    session_names.append(session_name)
        _set_project_config_value('sessions', session_names)
    else:
        click.prompt('Sessions have already been initialized in this project. You will need to manually initialize any additional sessions. Press enter to continue.', default='')

    
    use_singularity_for_ffmpeg = click.confirm('Do you want to use singularity for ffmpeg?', default=_get_project_config_value('use_singularity_for_ffmpeg'))
    _set_project_config_value('use_singularity_for_ffmpeg', use_singularity_for_ffmpeg)
    

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
