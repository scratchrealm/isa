import click
import isa


@click.group(help="Isa command-line client")
def cli():
    pass

@click.command(help="One-time initialization of an isa project")
def init():
    isa.init()

@click.command(help="Update one or more sessions")
@click.option('--session', required=False, default='')
@click.option('--all', is_flag=True)
def update(session: str, all: bool):
    if session and all:
        raise Exception('Cannot specify session with --all flag')
    if not session and not all:
        raise Exception('Either use the --session or the --all option')
    isa.update(session=session, all=all)


cli.add_command(init)
cli.add_command(update)