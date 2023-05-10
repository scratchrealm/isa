from typing import Tuple, Union
import os
import json


class RtcsharePlugin:
    def initialize(context):
        context.register_service('isa', IsaService)

class IsaService:
    def handle_query(query: dict, *, dir: str, user_id: Union[str, None]=None) -> Tuple[dict, bytes]:
        # todo: authenticate user
        type0 = query['type']
        if type0 == 'set_annotations':
            session_path = query['session_path']
            annotations = query['annotations']
            if session_path.startswith('$dir'):
                session_path = f'{dir}/{session_path[len("$dir"):]}'
            if not session_path.startswith('rtcshare://'):
                raise Exception(f'Invalid session path: {session_path}')
            session_relpath = session_path[len('rtcshare://'):]
            session_fullpath = os.path.join(os.environ['RTCSHARE_DIR'], session_relpath)
            annotations_fname = f'{session_fullpath}/annotations.json'
            with open(annotations_fname, 'w') as f:
                json.dump(annotations, f)
            return {'success': True}, b''
        else:
            raise Exception(f'Unexpected query type: {type0}')
