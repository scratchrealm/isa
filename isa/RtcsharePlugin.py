from typing import Tuple
import os
import json


class RtcsharePlugin:
    def initialize(context):
        context.register_service('isa', IsaService)

class IsaService:
    def handle_query(query: dict, *, dir: str) -> Tuple[dict, bytes]:
        type0 = query['type']
        if type0 == 'set_annotations':
            project_path = query['project_path']
            session_id = query['session_id']
            annotations = query['annotations']
            if project_path.startswith('$dir'):
                project_path = f'{dir}/{project_path[len("$dir"):]}'
            if not project_path.startswith('rtcshare://'):
                raise Exception(f'Invalid project path: {project_path}')
            project_relpath = project_path[len('rtcshare://'):]
            project_fullpath = os.path.join(os.environ['RTCSHARE_DIR'], project_relpath)
            annotations_fname = f'{project_fullpath}/{session_id}/annotations.json'
            with open(annotations_fname, 'w') as f:
                json.dump(annotations, f)
        else:
            raise Exception(f'Unexpected query type: {type0}')
