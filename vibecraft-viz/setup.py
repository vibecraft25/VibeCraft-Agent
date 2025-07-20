"""
VibeCraft-viz 패키지 설정
"""

from setuptools import setup, find_packages

with open("README.md", "r", encoding="utf-8") as fh:
    long_description = fh.read()

setup(
    name="vibecraft-viz",
    version="0.1.0",
    author="VibeCraft Team",
    author_email="vibecraft@example.com",
    description="React 데이터 시각화 애플리케이션 자동 생성 도구",
    long_description=long_description,
    long_description_content_type="text/markdown",
    url="https://github.com/yourusername/vibecraft-viz",
    packages=find_packages(),
    classifiers=[
        "Development Status :: 3 - Alpha",
        "Intended Audience :: Developers",
        "Topic :: Software Development :: Code Generators",
        "License :: OSI Approved :: MIT License",
        "Programming Language :: Python :: 3",
        "Programming Language :: Python :: 3.8",
        "Programming Language :: Python :: 3.9",
        "Programming Language :: Python :: 3.10",
        "Programming Language :: Python :: 3.11",
    ],
    python_requires=">=3.8",
    install_requires=[
        "pandas>=2.0.0",
        "numpy>=1.24.0",
    ],
    extras_require={
        "dev": [
            "pytest>=7.0.0",
            "black>=23.0.0",
            "flake8>=6.0.0",
            "mypy>=1.0.0",
        ],
    },
    entry_points={
        "console_scripts": [
            "vibecraft-viz=src.main:main",
        ],
    },
    include_package_data=True,
    package_data={
        "": ["templates/**/*.md"],
    },
)