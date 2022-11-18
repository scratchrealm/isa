import os
from typing import Union
from dataclasses import dataclass
import yaml
import kachery_cloud as kcl
import cv2
from .convert_avi_to_ogv import convert_avi_to_ogv
from .create_spectrograms import create_spectrograms
from .auto_detect_vocalizations import auto_detect_vocalizations
from .create_gui_data import create_gui_data
from ._find_singular_file_in_dir import _find_singular_file_in_dir
from ._project_config import _get_project_config_value

@dataclass
class IsaUpdateOpts:
    redo_spectrograms: bool=False,
    redo_video_conversion: bool=False,
    no_vocalization_detection: bool=False,
    redo_vocalization_detection: bool=False

def update(
    session: Union[str, None]=None,
    all: bool=False,
    opts: IsaUpdateOpts=IsaUpdateOpts()
):
    if opts.redo_spectrograms:
        if (not opts.no_vocalization_detection and not opts.redo_vocalization_detection) or (opts.no_vocalization_detection and opts.redo_vocalization_detection):
                raise Exception('You must specify exactly one of the following: redo_vocalization_detection no_vocalization_detection')
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
        f'./{session}',
        opts=opts
    )

def _update_session_dir(
    dirname: str,
    opts: IsaUpdateOpts
):
    recreate_gui_data = False
    config = _get_session_config(dirname)
    if 'video_uri' not in config:
        ogv_fname = _find_singular_file_in_dir(dirname, '.ogv')
        if (ogv_fname is None) or (opts.redo_video_conversion):
            avi_fname = _find_singular_file_in_dir(dirname, '.avi')
            if avi_fname is None:
                raise Exception(f'Unable to find .avi file in directory {dirname}')
            ogv_fname = avi_fname[:-4] + '.ogv'
            convert_avi_to_ogv(avi_fname, ogv_fname)
            recreate_gui_data = True
        
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
    if (not os.path.exists(spectrograms_pkl_fname)) or (opts.redo_spectrograms):
        create_spectrograms(dirname, spectrograms_pkl_fname)
        recreate_gui_data = True
    
    annotations_uri_fname = f'{dirname}/annotations.uri'
    do_auto_detect = (not os.path.exists(dirname) and not opts.no_vocalization_detection) or opts.redo_vocalization_detection
    if do_auto_detect:
        auto_detect_vocalizations(dirname, annotations_uri_fname)
        recreate_gui_data = True
    
    gui_data_uri_fname = f'{dirname}/gui_data.uri'
    if (not os.path.exists(gui_data_uri_fname)) or recreate_gui_data:
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