import asyncio
from js import document,AudioContext,PredictionManagerModule,PianoPlayerModule,console

# 1) Hook startup to DOMContentLoaded
def init(_):
    PianoPlayerModule.updateSequencesForClasses()
    PredictionManagerModule.onPrediction(on_prediction)

document.addEventListener("DOMContentLoaded", init)

#── 2a) Create a shared AudioContext ────────────────────────────────
audio_ctx = AudioContext.new()

#── 2b) Copy your note→frequency map from piano-player.js ───────────
note_frequencies = {
        'C3': 130.81, 'C#3': 138.59, 'D3': 146.83, 'D#3': 155.56, 'E3': 164.81, 'F3': 174.61,
        'F#3': 185.00, 'G3': 196.00, 'G#3': 207.65, 'A3': 220.00, 'A#3': 233.08, 'B3': 246.94,
        'C4': 261.63, 'C#4': 277.18, 'D4': 293.66, 'D#4': 311.13, 'E4': 329.63, 'F4': 349.23,
        'F#4': 369.99, 'G4': 392.00, 'G#4': 415.30, 'A4': 440.00, 'A#4': 466.16, 'B4': 493.88,
        'C5': 523.25, 'C#5': 554.37, 'D5': 587.33, 'D#5': 622.25, 'E5': 659.25, 'F5': 698.46,
        'F#5': 739.99, 'G5': 783.99, 'G#5': 830.61, 'A5': 880.00, 'A#5': 932.33, 'B5': 987.77
    }
note_durations = {
    'very short': 0.1, 'short': 0.2,
    'medium': 0.5, 'long': 1.0, 'very long': 2.0
}

def play_note_py(note, duration_label):
    console.log(f"Playing Note in main.py: {note} for {duration_label}")
    try:
        # Convert duration label to actual duration value
        duration = note_durations.get(duration_label, 0.5)  # Default to 0.5 seconds if unknown
        console.log(f"Duration resolved to: {duration} seconds")
        
        if audio_ctx.state == 'suspended':
            audio_ctx.resume()
        osc = audio_ctx.createOscillator()
        gain = audio_ctx.createGain()
        freq = note_frequencies.get(note)
        if not freq:
            console.warn(f"Unknown note: {note}")
            return
        
        console.log(f"Playing {note} at {freq}Hz for {duration}s")
        
        osc.frequency.setValueAtTime(freq, audio_ctx.currentTime)
        osc.type = 'sine'
        gain.gain.setValueAtTime(0, audio_ctx.currentTime)
        gain.gain.linearRampToValueAtTime(0.5, audio_ctx.currentTime + 0.01)
        gain.gain.linearRampToValueAtTime(0, audio_ctx.currentTime + duration)  # Now duration is a number!
        osc.connect(gain)
        gain.connect(audio_ctx.destination)
        osc.start()
        osc.stop(audio_ctx.currentTime + duration + 0.01)
        
        console.log(f"Note {note} played successfully!")
        
    except Exception as e:
        console.error("play_note_py error:", e)

def stop_all_py():
    """Stop all currently playing audio immediately"""
    console.log("Stopping all audio in main.py")
    try:
        # Suspend and immediately resume the audio context
        # This effectively stops all currently playing sounds
        if audio_ctx.state == 'running':
            audio_ctx.suspend()
            console.log("Audio context suspended - all sounds stopped")
            
            # Resume immediately so new sounds can play
            audio_ctx.resume()
            console.log("Audio context resumed - ready for new sounds")
        
    except Exception as e:
        console.error("stop_all_py error:", e)

def stop_all_motors_py():
    """Stop all motors - placeholder for future motor functionality"""
    console.log("Stop all motors called in main.py")
    # This is a placeholder - motor stopping is currently handled by the MotorGroupController
    # via PyREPL commands, but you can add additional motor stopping logic here if needed
    pass

# Async callback for predictions (placeholder - you'll need to implement this)
async def on_prediction(pred):
    # This function will be called when ML predictions are made
    # You can implement note sequence playing here if needed
    console.log(f"Prediction received in Python: {pred}")

# 6) Hook functions up to be accessed via js
from js import window
# make your Python functions callable from JS
window.pyPlayNote = play_note_py
window.pyStopAll = stop_all_py
window.pyStopAllMotors = stop_all_motors_py