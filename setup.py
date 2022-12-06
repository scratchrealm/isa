from setuptools import setup, find_packages

setup(
    packages=find_packages(),
    scripts=[],
    include_package_data = True,
    install_requires=[
        'click',
        'h5py',
        'matplotlib',
        'kachery_cloud>=0.3.8',
        'figurl>=0.2.16'
    ],
    entry_points={
        'console_scripts': [
            'isa=isa.cli:cli'
        ]
    }
)
