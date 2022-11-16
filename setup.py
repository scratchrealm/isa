from setuptools import setup, find_packages

setup(
    packages=find_packages(),
    scripts=[],
    include_package_data = True,
    install_requires=[
        'click',
        'kachery_cloud>=0.3.7'
    ],
    entry_points={
        'console_scripts': [
            'isa=isa.cli:cli'
        ]
    }
)
