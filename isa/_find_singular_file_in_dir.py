from typing import Union
import os


def _find_singular_file_in_dir(dirname: str, extensions: Union[str, list[str]]):
    if type(extensions) == str:
        extensions = [extensions]
    fnames = os.listdir(dirname)
    matching_fnames: list[str] = []
    for fname in fnames:
        for extension in extensions:
            if fname.endswith(extension):
                matching_fnames.append(fname)
                break
    if len(matching_fnames) == 0:
        return None
    if len(matching_fnames) > 1:
        raise Exception(f'More than one {extension} file found in directory: {dirname}')
    return matching_fnames[0]