import os
from typing import Union
import yaml
import kachery_cloud as kcl
import cv2
from .init import _find_singular_file_in_dir
from .create_index_md import create_index_md
from .convert_avi_to_ogv import convert_avi_to_ogv
from .create_spectrograms import create_spectrograms
from .auto_detect_vocalizations import auto_detect_vocalizations
from .create_gui_data import create_gui_data


def update(session: Union[str, None]=None, all: bool=False):
    if all:
        if session is not None:
            raise Exception('Cannot specify session with all')
        config = _get_project_config()
        for session_name in config['sessions']:
            update(session=session_name)
        return
    if session is None:
        raise Exception('Must specify session')
    
    _update_session_dir(f'./{session}')

    create_index_md('.')

def _update_session_dir(dirname: str):
    config = _get_session_config(dirname)
    if 'video_uri' not in config:
        ogv_fname = _find_singular_file_in_dir(dirname, '.ogv')
        if ogv_fname is None:
            avi_fname = _find_singular_file_in_dir(dirname, '.avi')
            if avi_fname is None:
                raise Exception(f'Unable to find .avi file in directory {dirname}')
            ogv_fname = avi_fname[:-4] + '.ogv'
            convert_avi_to_ogv(avi_fname, ogv_fname)
        
        vid = cv2.VideoCapture(ogv_fname)
        height = int(vid.get(cv2.CAP_PROP_FRAME_HEIGHT))
        width = int(vid.get(cv2.CAP_PROP_FRAME_WIDTH))
        fps = vid.get(cv2.CAP_PROP_FPS)
        print(f'height/width: {height}/{width}')
        print(f'fps: {fps}')

        print(f'Uploading file: {ogv_fname}')
        uri = kcl.store_file(ogv_fname)

        config = _get_session_config(dirname) # reload in case something changed
        config['video_uri'] = uri
        config['video_dims'] = [height, width]
        config['video_sr_hz'] = fps
        _set_session_config(dirname, config)
    
    spectrograms_pkl_fname = f'{dirname}/spectrograms.pkl'
    if not os.path.exists(spectrograms_pkl_fname):
        create_spectrograms(dirname, spectrograms_pkl_fname)
    
    annotations_uri_fname = f'{dirname}/annotations.uri'
    if not os.path.exists(annotations_uri_fname):
        auto_detect_vocalizations(dirname, annotations_uri_fname)
    
    gui_data_uri_fname = f'{dirname}/gui_data.uri'
    if not os.path.exists(gui_data_uri_fname):
        create_gui_data(dirname, gui_data_uri_fname)
        

def _get_session_config(dirname: str):
    config_yaml_fname = f'{dirname}/isa-session.yaml'
    if not os.path.exists(config_yaml_fname):
        raise Exception(f'File does not exist: {config_yaml_fname}')
    with open(config_yaml_fname, 'r') as f:
        config = yaml.safe_load(f)
    return config

def _set_session_config(dirname: str, config: dict):
    config_yaml_fname = f'{dirname}/isa-session.yaml'
    with open(config_yaml_fname, 'w') as f:
        yaml.dump(config, f)

def _get_project_config():
    isa_project_yaml_fname = 'isa-project.yaml'
    if not os.path.exists(isa_project_yaml_fname):
        raise Exception(f'File does not exist: {isa_project_yaml_fname}')
    with open(isa_project_yaml_fname, 'r') as f:
        config = yaml.safe_load(f)
    return config
