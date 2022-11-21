import os
from ._project_config import _get_project_config_value


def convert_avi_to_ogv(avi_fname: str, ogv_fname: str):
    use_singularity_for_ffmpeg = _get_project_config_value('use_singularity_for_ffmpeg')

    cmd = f'ffmpeg -i {avi_fname} -c:v libtheora -q:v 7 -c:a libvorbis -q:a 4 {ogv_fname}'

    if use_singularity_for_ffmpeg:
        print(avi_fname)
        print(ogv_fname)
        dirname1 = os.path.dirname(avi_fname)
        dirname2 = os.path.dirname(ogv_fname)
        if dirname1 != dirname2:
            raise Exception(f'Files must be in the same parent directory: {avi_fname} {ogv_fname}')
        cmd = f'singularity exec docker://jrottenberg/ffmpeg --bind {dirname1}:{dirname1} {cmd}'
    
    os.system(cmd)