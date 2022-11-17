import os
import yaml
import json
from typing import List
from ._project_config import _get_project_config_value

def create_index_md(dirname: str):
    repository_url = _get_project_config_value('repository_url')
    user, repo = _parse_repository_url(repository_url)

    session_names = _get_project_config_value('sessions')

    sessions_dirname = f'{dirname}'
    output_fname = f'{dirname}/index.md'

    markdown_lines: List[str] = []
    markdown_lines.append('# Sessions')
    for session_name in session_names:
        session_dir_path = f'{sessions_dirname}/{session_name}'
        if not os.path.isdir(session_dir_path):
            raise Exception(f'Not a directory: {session_dir_path}')
        print(f'======================')
        print(f'{session_name}')
        config_fname = f'{session_dir_path}/isa-session.yaml'
        if not os.path.exists(config_fname):
            raise Exception(f'No isa-session.yaml found in {session_dir_path}')
        with open(config_fname, 'r') as f:
            config = yaml.safe_load(f)
        markdown_lines.append('')
        markdown_lines.append(f'## {session_name}')
        gui_data_uri_fname = f'{session_dir_path}/gui_data.uri'
        if os.path.exists(gui_data_uri_fname):
            with open (gui_data_uri_fname, 'r') as f:
                gui_data_uri = f.read()
        else:
            print(f'No gui_data.uri found for {session_name}')
            gui_data_uri = None
        if gui_data_uri is not None:
            vocalizations_gh_uri = f'gh://{user}/{repo}/main/{session_name}/annotations.uri'
            state = {'vocalizations': vocalizations_gh_uri}
            state_json = json.dumps(state, separators=(',', ':'))
            url = f'https://figurl.org/f?v=gs://figurl/neurostatslab-views-1dev6&d={gui_data_uri}&s={state_json}&label={session_name}'
            markdown_lines.append('')
            markdown_lines.append(f'[Open session for visualization and editing]({url})')
            
    markdown_lines.append('')
    markdown_lines.append('---')
    markdown_lines.append('')
    markdown_lines.append('This file was auto-generated.')

    markdown = '\n'.join(markdown_lines)

    print(f'Writing {output_fname}')
    with open(output_fname, 'w') as f:
        f.write(markdown)

def _parse_repository_url(repository_url: str):
    a = repository_url.split('/')
    # https://github.com/user/repo
    user = a[3]
    repo = a[4]
    return user, repo