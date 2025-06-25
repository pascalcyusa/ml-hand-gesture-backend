# ml-hand-gesture-backend

A hand gesture recognition system that uses machine learning to control piano notes and motors through PyScript.

## About PyScript and Linter Errors

This project uses **PyScript**, which allows Python code to run directly in the browser and access JavaScript objects. This creates some linter errors because traditional Python linters don't understand PyScript's `from js import` syntax.

### Why You See Import Errors

The linter errors you're seeing are normal and expected when using PyScript:

```python
from js import document, AudioContext, PredictionManagerModule, PianoPlayerModule, console
```

These imports work at runtime in the browser but appear as errors to static analysis tools.

### Solutions Implemented

1. **Type Ignore Comments**: Added `# type: ignore` at the top of `main.py`
2. **Type Stubs**: Created `js.pyi` with type definitions for JavaScript objects
3. **Configuration Files**: Added linter configuration files to suppress PyScript-related errors:
   - `.pylintrc` - Configures Pylint
   - `.flake8` - Configures Flake8  
   - `pyproject.toml` - Configures MyPy

### How to Run

1. Start the development server:
   ```bash
   python server.py
   ```

2. Open your browser to the local server URL

3. The PyScript code will run in the browser and access JavaScript objects without issues

### Development Notes

- The linter errors are cosmetic and don't affect functionality
- PyScript handles the JavaScript integration at runtime
- All configuration files are set up to ignore PyScript-specific import errors
- The code will work correctly in the browser despite the linter warnings

## Project Structure

- `main.py` - Main PyScript application with audio and prediction handling
- `js/` - JavaScript modules for hand detection, model training, and UI
- `server.py` - Development server
- `index.html` - Main HTML file with PyScript integration