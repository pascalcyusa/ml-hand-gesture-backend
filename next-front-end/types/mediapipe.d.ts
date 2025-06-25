// MediaPipe TypeScript declarations

declare global {
    interface Window {
        // TensorFlow.js
        tf?: any

        // Python functions (from main.py)
        pyPlayNote?: (note: string, duration: string) => void
        pyStopAll?: () => void
        pyStopAllMotors?: () => void
    }
}

// MediaPipe specific types
export interface HandLandmark {
    x: number
    y: number
    z: number
}

export interface HandLandmarkerResult {
    landmarks: HandLandmark[][]
    handedness: any[]
}

export interface HandLandmarkerOptions {
    baseOptions: {
        modelAssetPath: string
        delegate: string
    }
    runningMode: string
    numHands: number
}

export interface FilesetResolver {
    forVisionTasks: (path: string) => Promise<any>
}

export interface HandLandmarker {
    createFromOptions: (vision: any, options: HandLandmarkerOptions) => Promise<HandLandmarker>
    detectForVideo: (video: HTMLVideoElement, timestamp: number) => HandLandmarkerResult
}

export interface DrawingUtils {
    drawConnectors: (ctx: CanvasRenderingContext2D, landmarks: HandLandmark[], connections: number[][], options?: any) => void
    drawLandmarks: (ctx: CanvasRenderingContext2D, landmarks: HandLandmark[], options?: any) => void
} 