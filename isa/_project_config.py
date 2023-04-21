import os
import yaml


def _set_project_config_value(key: str, val: str):
    isa_project_yaml_fname = 'isa-project.yaml'
    if os.path.exists(isa_project_yaml_fname):
        with open(isa_project_yaml_fname, 'r') as f:
            project_config = yaml.safe_load(f)
        if project_config is None:
            project_config = {}
    else:
        project_config = {}
    project_config[key] = val
    with open(isa_project_yaml_fname, 'w') as f:
        yaml.dump(project_config, f)

def _get_project_config_value(key: str):
    isa_project_yaml_fname = 'isa-project.yaml'
    if os.path.exists(isa_project_yaml_fname):
        with open(isa_project_yaml_fname, 'r') as f:
            project_config = yaml.safe_load(f)
        if project_config is None:
            project_config = {}
    else:
        project_config = {}
    return project_config.get(key, None)

def _check_project_config_exists():
    isa_project_yaml_fname = 'isa-project.yaml'
    return os.path.exists(isa_project_yaml_fname)

def _set_session_config_value(session: str, key: str, val: str):
    isa_session_yaml_fname = f'./{session}/isa-session.yaml'
    if os.path.exists(isa_session_yaml_fname):
        with open(isa_session_yaml_fname, 'r') as f:
            session_config = yaml.safe_load(f)
        if session_config is None:
            session_config = {}
    else:
        session_config = {}
    session_config[key] = val
    with open(isa_session_yaml_fname, 'w') as f:
        yaml.dump(session_config, f)

def _get_session_config_value(session: str, key: str):
    isa_session_yaml_fname = f'./{session}/isa-session.yaml'
    if os.path.exists(isa_session_yaml_fname):
        with open(isa_session_yaml_fname, 'r') as f:
            session_config = yaml.safe_load(f)
        if session_config is None:
            session_config = {}
    else:
        session_config = {}
    return session_config.get(key, None)