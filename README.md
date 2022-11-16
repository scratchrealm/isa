# isa

Isa (Ee-suh) is a visualization and annotation tool for sound source location.

## Installation and setup

Requirements
* Linux or Mac
* Conda (recommended)
* Python >= 3.8
* [ffmpeg](https://ffmpeg.org/) or [singularity](https://docs.sylabs.io/guides/3.5/user-guide/introduction.html)

It is recommended that you use a Conda environment.

Clone this repo, then

```bash
cd isa
pip install -e .
```

Initialize a [kachery-cloud](https://github.com/flatironinstitute/kachery-cloud#readme) client

```bash
kachery-cloud-init
# follow the instructions to associate your client with your Google user name on kachery-cloud
```

## Create a project

Use the following directory structure for your project

```
my-project/
  session1/
    video-file-name.avi
    audio-file-name.h5
  session2/
  session3/
  ...
```

TODO: explain about the project name

TODO: explain about the session names

TODO: explain about the `.avi` and `.h5` files

Initialize the project

```bash
cd my-project
isa init
# follow the interactive prompts
```

This will create a `isa-project.yml` file at the root project directory and `isa-session.yml` files in each session folder.

## Update the project

To update the processing for all sessions, use

```
isa update --all
```
