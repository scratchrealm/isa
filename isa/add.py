import os
from ._project_config import _get_project_config_value, _set_project_config_value, _check_project_config_exists
from .init import _initialize_or_update_session_dir


def add(session_id: str):
    if not _check_project_config_exists():
        raise Exception('isa-project.yaml does not exist. Please run isa init first.')
    sessions: list[str] = _get_project_config_value('sessions')
    if session_id in sessions:
        raise Exception(f'Session already in project: {session_id}')
    if not os.path.exists(session_id):
        raise Exception(f'Cannot find session directory: {session_id}')
    sessions.append(session_id)
    _set_project_config_value('sessions', sessions)
    _initialize_or_update_session_dir(session_id)