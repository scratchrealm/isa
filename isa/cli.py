import click
import isa
from .update import IsaUpdateOpts


@click.group(help="Isa command-line client")
def cli():
    pass

@click.command(help="One-time initialization of an isa project")
def init():
    isa.init()

@click.command(help="Add a session to an isa project")
@click.argument('session_id')
def add(session_id: str):
    isa.add(session_id)

@click.command(help="Update one or more sessions")
@click.option('--session', required=False, default='', help="Session to process, if not using --all")
@click.option('--all', is_flag=True, help="Process all sessions")
@click.option('--redo-spectrograms', is_flag=True, help="Recompute the spectrograms")
@click.option('--redo-video-conversion', is_flag=True, help="Redo the video conversion")
@click.option('--no-vocalization-detection', is_flag=True, help="disable automatic vocalization detection")
@click.option('--redo-vocalization-detection', is_flag=True, help="force recompute automatic vocalization detection")
def update(
    session: str,
    all: bool,
    redo_spectrograms: bool,
    redo_video_conversion: bool,
    no_vocalization_detection: bool,
    redo_vocalization_detection: bool
):
    if session and all:
        raise Exception('Cannot specify session with --all flag')
    if not session and not all:
        raise Exception('Either use the --session or the --all option')
    if redo_spectrograms:
        if (not no_vocalization_detection and not redo_vocalization_detection) or (no_vocalization_detection and redo_vocalization_detection):
            raise Exception('You must specify exactly one of the following: --redo-vocalization-detection --no-vocalization-detection')
    isa.update(
        session=session,
        all=all,
        opts=IsaUpdateOpts(
            redo_spectrograms=redo_spectrograms,
            redo_video_conversion=redo_video_conversion,
            no_vocalization_detection=no_vocalization_detection,
            redo_vocalization_detection=redo_vocalization_detection
        )
    )
    isa.create_index_md('.')


cli.add_command(init)
cli.add_command(add)
cli.add_command(update)