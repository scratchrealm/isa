# isa

Isa (Ee-suh) is a visualization and annotation tool for sound source localization.

## Installation and setup
It is recommended that you use a Conda environment.

Requirements
* Linux or Mac
* Conda (recommended)
* Python >= 3.8
* pyqt and opencv-python - todo: why is pyqt required?

Install isa-ssl from PyPI:

```bash
pip install isa-ssl
```

Install rtcshare

Todo: provide instructions for rtcshare

## Create a project

Use the following directory structure for your project

```bash
my-project/ # replace with the name of your project
  session1/
    video-file-name.avi
    audio-file-name.h5 (or audio-file-name.wav)
  session2/
  session3/
  ...
```

Initialize the project

```bash
cd my-project
isa init
# Follow the interactive prompts if there are any
```

You will find an `isa-project.yaml` file at the root project directory and `isa-session.yaml` files in each session folder.

To compute the spectrograms and prepare other data, you will need to update the sessions (see below).

## Updating the project

To update the processing for all sessions, use

```bash
isa update --all
```

Or to update a single session, use

```bash
# replace SESSION_ID with the session ID
isa update --session SESSION_ID
```

## Advanced options

You can force-recompute various steps. For more information, run

```
isa update --help
```

## Adding a session

Create a new directory for the session and add .h5 (or .wav) and .avi files. The name of the directory should be the session ID.

Add the session ID to the list of sessions in isa-project.yaml by running

```bash
# replace SESSION_ID with the session ID
isa add SESSION_ID
```

Initialize and update the new session

```bash
isa init

# replace SESSION_ID with the session ID
isa update --session SESSION_ID
```
