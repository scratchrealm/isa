# isa

Isa (Ee-suh) is a visualization and annotation tool for sound source location.

## Installation and setup
It is recommended that you use a Conda environment.

Requirements
* Linux or Mac
* Conda (recommended)
* Python >= 3.8
* pyqt and opencv-python
* [ffmpeg](https://ffmpeg.org/) or [singularity](https://docs.sylabs.io/guides/3.5/user-guide/introduction.html)

NOTE: We recommend installing ffmpeg via Homebrew. You can install Homebrew and ffmpeg using the following commands:
```
/bin/bash -c "$(curl -fsSL https://raw.githubusercontent.com/Homebrew/install/master/install.sh)"
brew install ffmpeg --HEAD
```
For now, during development, you must install isa from source. Clone this repo, then

```bash
cd isa
pip install -e .
```

Initialize a [kachery-cloud](https://github.com/flatironinstitute/kachery-cloud#readme) client

```bash
kachery-cloud-init
# follow the instructions to associate your client with your GitHub user name on kachery-cloud
```

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
# Follow the interactive prompts
```

This will guide you through the process of configuring your project and initializing a new local GitHub repository.

You will find an `isa-project.yaml` file at the root project directory and `isa-session.yaml` files in each session folder.

Commit the new files to the local git repo:

```bash
# Check the status to see the changes
git status

# Add all files whitelisted in .gitignore
git add .

# Check the status to see what will be added
git status

# Commit the changes
git commit -m "initialize project"
```

Configure the git remote and push the new files

```bash
# fill in the appropriate <user> and <repo>
git remote add origin https://github.com/user/repo.git
git branch -M main
git push -u origin main
```

## Updating the project

To update the processing for all sessions, use

```bash
module load singularity #if running on FI cluster
isa update --all
```

Then, if ready, commit and push the changes to the GitHub repo

```bash
# Check to see if something has changed
git status

# If something has changed, add and commit
git add .
git status
# Fill in a custom message based on what you have changed
git commit -m "update project"
git push
```

Navigate to the GitHub repo in your browser and open the `index.md` file.

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
isa --update --session SESSION_ID
```
