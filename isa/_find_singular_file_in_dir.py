import os


def _find_singular_file_in_dir(dirname: str, extension: str):
    fnames = os.listdir(dirname)
    f_fnames = [f for f in fnames if f.endswith(extension)]
    if len(f_fnames) == 0:
        return None
    if len(f_fnames) > 1:
        raise Exception(f'More than one {extension} file found in directory: {dirname}')
    return f'{dirname}/{f_fnames[0]}'