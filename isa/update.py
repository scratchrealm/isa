import os
from typing import Union
from dataclasses import dataclass
import yaml
import pandas as pd
from .create_spectrograms import create_spectrograms
from .auto_detect_vocalizations import auto_detect_vocalizations
from ._project_config import _get_project_config_value
from .init import _initialize_or_update_session_dir

@dataclass
class IsaUpdateOpts:
    redo_spectrograms: bool=False,
    no_vocalization_detection: bool=False,
    redo_vocalization_detection: bool=False

def update(
    session: Union[str, None]=None,
    all: bool=False,
    opts: IsaUpdateOpts=IsaUpdateOpts()
):
    print(f'Updating session: {session}')
    if opts.redo_spectrograms:
        if opts.no_vocalization_detection and opts.redo_vocalization_detection:
            raise Exception('You cannot specify both redo_vocalization_detection and no_vocalization_detection')
    if all:
        if session:
            raise Exception('Cannot specify session with all')
        session_names = _get_project_config_value('sessions')
        for session_name in session_names:
            update(
                session=session_name,
                opts=opts
            )
        return
    if session is None:
        raise Exception('Must specify session')
    
    _update_session_dir(
        session,
        opts=opts
    )

def _update_session_dir(
    session: str,
    opts: IsaUpdateOpts
):
    dirname = f'./{session}'
    sessions_in_config = _get_project_config_value('sessions')
    if session not in sessions_in_config:
        raise Exception(f'Session {session} not found in project config. Use "isa add" to add it.')
    
    _initialize_or_update_session_dir(session)
    
    spectrograms_pkl_fname = f'./{session}/spectrograms.pkl'
    spectrogram_for_gui_zarr_fname = f'./{session}/spectrogram_for_gui.zarr'
    if (not os.path.exists(spectrograms_pkl_fname) or not os.path.exists(spectrogram_for_gui_zarr_fname)) or (opts.redo_spectrograms):
        create_spectrograms(session)
    
    annotations_json_fname = f'{dirname}/annotations.json'
    do_auto_detect = (not os.path.exists(annotations_json_fname) and not opts.no_vocalization_detection) or opts.redo_vocalization_detection
    if do_auto_detect:
        auto_detect_vocalizations(session, annotations_json_fname)

def _get_session_config(session: str):
    config_yaml_fname = f'./{session}/isa-session.yaml'
    if not os.path.exists(config_yaml_fname):
        raise Exception(f'File does not exist: {config_yaml_fname}')
    with open(config_yaml_fname, 'r') as f:
        config = yaml.safe_load(f)
    return config

def _set_session_config(session: str, config: dict):
    config_yaml_fname = f'./{session}/isa-session.yaml'
    with open(config_yaml_fname, 'w') as f:
        yaml.dump(config, f)