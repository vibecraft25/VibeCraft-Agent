#!/usr/bin/env python3
"""
VibeCraft Agent 패키지 설정
"""

from setuptools import setup, find_packages
from pathlib import Path

# README 파일 읽기
this_directory = Path(__file__).parent
long_description = (this_directory / "README.md").read_text(encoding="utf-8")

setup(
    name="vibecraft",
    version="2.0.0",
    author="VibeCraft Team",
    author_email="your-email@example.com",
    description="Gemini CLI 기반 데이터 시각화 도구",
    long_description=long_description,
    long_description_content_type="text/markdown",
    url="https://github.com/yourusername/vibecraft-agent-v2",
    project_urls={
        "Bug Tracker": "https://github.com/yourusername/vibecraft-agent-v2/issues",
        "Documentation": "https://vibecraft.readthedocs.io",
        "Source Code": "https://github.com/yourusername/vibecraft-agent-v2",
    },
    classifiers=[
        "Development Status :: 4 - Beta",
        "Intended Audience :: Developers",
        "Intended Audience :: Science/Research",
        "Topic :: Scientific/Engineering :: Visualization",
        "License :: OSI Approved :: MIT License",
        "Programming Language :: Python :: 3",
        "Programming Language :: Python :: 3.8",
        "Programming Language :: Python :: 3.9",
        "Programming Language :: Python :: 3.10",
        "Programming Language :: Python :: 3.11",
        "Programming Language :: Python :: 3.12",
        "Operating System :: OS Independent",
    ],
    python_requires=">=3.8",
    py_modules=["vibecraft"],
    install_requires=[
        # 핵심 기능은 표준 라이브러리만 사용
    ],
    extras_require={
        "dev": [
            "pytest>=7.0.0",
            "pytest-cov>=4.0.0",
            "pytest-mock>=3.10.0",
            "black>=23.0.0",
            "flake8>=6.0.0",
            "mypy>=1.0.0",
            "isort>=5.12.0",
        ],
        "docs": [
            "sphinx>=5.0.0",
            "sphinx-rtd-theme>=1.2.0",
        ],
        "dotenv": [
            "python-dotenv>=1.0.0",
        ],
    },
    entry_points={
        "console_scripts": [
            "vibecraft=vibecraft:main",
        ],
    },
    include_package_data=True,
    package_data={
        "": ["*.md"],
    },
    zip_safe=False,
)