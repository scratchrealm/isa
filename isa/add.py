from typing import List
from ._project_config import _get_project_config_value, _set_project_config_value


def add(session_id: str):
    sessions: List[str] = _get_project_config_value('sessions')
    if session_id in sessions:
        raise Exception(f'Session already in project: {session_id}')
    sessions.append(session_id)
    _set_project_config_value('sessions', sessions)