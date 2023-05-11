from setuptools import setup, find_packages

setup(
    packages=find_packages(),
    scripts=[],
    include_package_data = True,
    install_requires=[
        'click',
        'h5py',
        'zarr',
        'matplotlib',
        'opencv-python'
    ],
    entry_points={
        'console_scripts': [
            'isa=isa.cli:cli'
        ]
    }
)
