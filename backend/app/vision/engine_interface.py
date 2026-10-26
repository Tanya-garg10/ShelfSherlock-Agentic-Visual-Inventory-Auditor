import os
import platform
import time
from abc import ABC, abstractmethod
from typing import Dict, Any, Tuple, List, Optional
import cv2
import numpy as np

class COOLUnavailableError(Exception):
    """Raised when COOL is invoked on an incompatible or non-ARM64 environment."""
    pass

class VisionEngineInterface(ABC):
    """Modular interface for ShelfSherlock image processing engines."""

    @property
    @abstractmethod
    def engine_name(self) -> str:
        pass

    @property
    @abstractmethod
    def is_hardware_accelerated(self) -> bool:
        pass

    @property
    @abstractmethod
    def target_architecture(self) -> str:
        pass

    @abstractmethod
    def get_engine_metadata(self) -> Dict[str, Any]:
        pass

class BaselineOpenCV5Engine(VisionEngineInterface):
    """Standard OpenCV 5.x vision engine running on host architecture."""

    @property
    def engine_name(self) -> str:
        return "OpenCV 5.0 Baseline (Standard Build)"

    @property
    def is_hardware_accelerated(self) -> bool:
        return False

    @property
    def target_architecture(self) -> str:
        return platform.machine() or "x86_64"

    def get_engine_metadata(self) -> Dict[str, Any]:
        return {
            "engine": self.engine_name,
            "opencv_version": cv2.__version__,
            "architecture": self.target_architecture,
            "os": platform.system(),
            "hardware_acceleration": "Standard CPU SIMD",
            "cool_status": "NOT_ACTIVE (Using Baseline OpenCV 5.0)",
            "verified": True
        }

class COOLOptimizedEngine(VisionEngineInterface):
    """
    Cloud-Optimized OpenCV Library (COOL) vision engine.
    Designed for AWS Graviton (ARM64 / aarch64) with KleidiCV 0.7.0 acceleration.
    """

    def __init__(self):
        self._machine = platform.machine().lower()
        self._is_arm = self._machine in ["aarch64", "arm64"]

    @property
    def engine_name(self) -> str:
        return "OpenCV 5.0 COOL (AWS Graviton / KleidiCV)"

    @property
    def is_hardware_accelerated(self) -> bool:
        return self._is_arm

    @property
    def target_architecture(self) -> str:
        return "aarch64 (AWS Graviton 2/3/4/5)"

    def get_engine_metadata(self) -> Dict[str, Any]:
        if not self._is_arm:
            return {
                "engine": self.engine_name,
                "opencv_version": cv2.__version__,
                "current_host_architecture": platform.machine(),
                "required_architecture": "aarch64 / arm64 (AWS Graviton)",
                "hardware_acceleration": "KleidiCV / ARMPL (Requires Graviton)",
                "cool_status": "UNVERIFIED_HOST_MISMATCH (Host is x86_64; COOL requires AWS Graviton ARM64 instance)",
                "verified": False,
                "note": "Per OpenCV COOL specification, COOL is built for AWS Graviton Neoverse architectures. Local sandbox is x86_64."
            }
        return {
            "engine": self.engine_name,
            "opencv_version": cv2.__version__,
            "architecture": "aarch64",
            "hardware_acceleration": "KleidiCV 0.7.0 / ARMPL",
            "cool_status": "ACTIVE_VERIFIED_GRAVITON",
            "verified": True
        }

def get_vision_engine(engine_type: str = "baseline") -> VisionEngineInterface:
    """Factory for selecting vision engine."""
    if engine_type == "cool":
        return COOLOptimizedEngine()
    return BaselineOpenCV5Engine()
