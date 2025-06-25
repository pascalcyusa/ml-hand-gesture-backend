# Type stubs for PyScript JavaScript integration
from typing import Any, Callable

# Browser DOM objects
document: Any
window: Any

# Web Audio API
class AudioContext:
    def __init__(self) -> None: ...
    state: str
    currentTime: float
    destination: Any
    
    def resume(self) -> None: ...
    def suspend(self) -> None: ...
    def createOscillator(self) -> Any: ...
    def createGain(self) -> Any: ...
    
    @classmethod
    def new(cls) -> 'AudioContext': ...

# Console for logging
console: Any

# Custom modules (these will be defined by your JavaScript code)
PredictionManagerModule: Any
PianoPlayerModule: Any 