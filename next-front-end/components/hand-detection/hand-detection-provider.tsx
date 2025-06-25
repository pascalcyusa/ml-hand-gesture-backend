"use client"

import React, { createContext, useContext, useEffect, useState, ReactNode } from "react"
import { FilesetResolver, HandLandmarker } from "@mediapipe/tasks-vision"
import { toast } from "sonner"

interface HandDetectionContextType {
    isInitialized: boolean
    isDetecting: boolean
    handLandmarks: any[] | null
    startDetection: () => Promise<void>
    stopDetection: () => void
    error: string | null
}

const HandDetectionContext = createContext<HandDetectionContextType | undefined>(undefined)

export function useHandDetection() {
    const context = useContext(HandDetectionContext)
    if (context === undefined) {
        throw new Error("useHandDetection must be used within a HandDetectionProvider")
    }
    return context
}

interface HandDetectionProviderProps {
    children: ReactNode
}

export function HandDetectionProvider({ children }: HandDetectionProviderProps) {
    const [isInitialized, setIsInitialized] = useState(false)
    const [isDetecting, setIsDetecting] = useState(false)
    const [handLandmarks, setHandLandmarks] = useState<any[] | null>(null)
    const [error, setError] = useState<string | null>(null)
    const [handLandmarker, setHandLandmarker] = useState<HandLandmarker | null>(null)
    const [videoElement, setVideoElement] = useState<HTMLVideoElement | null>(null)
    const [canvasElement, setCanvasElement] = useState<HTMLCanvasElement | null>(null)

    // Initialize MediaPipe
    useEffect(() => {
        async function initializeMediaPipe() {
            try {
                console.log("Starting MediaPipe initialization...")

                // Initialize vision tasks
                const vision = await FilesetResolver.forVisionTasks(
                    "https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@latest/wasm"
                )

                console.log("Vision tasks initialized, creating hand landmarker...")

                const landmarker = await HandLandmarker.createFromOptions(vision, {
                    baseOptions: {
                        modelAssetPath: "https://storage.googleapis.com/mediapipe-models/hand_landmarker/hand_landmarker/float16/1/hand_landmarker.task",
                        delegate: "GPU"
                    },
                    runningMode: "VIDEO",
                    numHands: 2
                })

                setHandLandmarker(landmarker)
                setIsInitialized(true)
                setError(null)
                console.log("MediaPipe initialized successfully!")
            } catch (err) {
                console.error("Failed to initialize MediaPipe:", err)
                setError(`Failed to initialize hand detection: ${err instanceof Error ? err.message : 'Unknown error'}. Please check your internet connection and refresh the page.`)
            }
        }

        initializeMediaPipe()
    }, [])

    const startDetection = async () => {
        console.log("startDetection called")
        console.log("State:", { isInitialized, handLandmarker: !!handLandmarker })

        if (!isInitialized || !handLandmarker) {
            console.log("Not initialized or no landmarker")
            setError("Hand detection not initialized")
            return
        }

        try {
            console.log("Creating/getting video and canvas elements...")

            // Create or get video element
            let video = document.getElementById("webcam") as HTMLVideoElement
            let canvas = document.getElementById("pose-canvas") as HTMLCanvasElement

            console.log("Found elements:", { video: !!video, canvas: !!canvas })

            // If elements don't exist, create them
            if (!video) {
                console.log("Creating video element...")
                video = document.createElement("video")
                video.id = "webcam"
                video.autoplay = true
                video.playsInline = true
                video.style.transform = "scaleX(-1)"
                video.style.position = "absolute"
                video.style.inset = "0"
                video.style.width = "100%"
                video.style.height = "100%"
                video.style.objectFit = "cover"
            }

            if (!canvas) {
                console.log("Creating canvas element...")
                canvas = document.createElement("canvas")
                canvas.id = "pose-canvas"
                canvas.style.transform = "scaleX(-1)"
                canvas.style.position = "absolute"
                canvas.style.inset = "0"
                canvas.style.width = "100%"
                canvas.style.height = "100%"
            }

            // Find the container and append elements if they're not already there
            const container = document.querySelector('.relative.w-full.aspect-video')
            console.log("Found container:", !!container)

            if (container) {
                if (!document.getElementById("webcam")) {
                    console.log("Appending video to container...")
                    container.appendChild(video)
                }
                if (!document.getElementById("pose-canvas")) {
                    console.log("Appending canvas to container...")
                    container.appendChild(canvas)
                }
            }

            setVideoElement(video)
            setCanvasElement(canvas)

            console.log("Requesting camera permissions...")
            // Start video stream
            const stream = await navigator.mediaDevices.getUserMedia({
                video: { width: 640, height: 480 }
            })
            console.log("Camera stream obtained:", !!stream)

            video.srcObject = stream
            await video.play()
            console.log("Video started playing")

            setIsDetecting(true)
            setError(null)
            console.log("Detection started successfully")
            toast.success("Hand detection started! Show your hand to the camera.")

            // Start detection loop
            detectHands()
        } catch (err) {
            console.error("Failed to start detection:", err)
            setError("Failed to access camera. Please check permissions.")
        }
    }

    const stopDetection = () => {
        if (videoElement && videoElement.srcObject) {
            const stream = videoElement.srcObject as MediaStream
            stream.getTracks().forEach(track => track.stop())
            videoElement.srcObject = null
        }
        setIsDetecting(false)
        setHandLandmarks(null)
        toast.info("Hand detection stopped.")
    }

    const detectHands = () => {
        if (!isDetecting || !videoElement || !canvasElement || !handLandmarker) {
            console.log("Detection stopped - missing requirements:", {
                isDetecting,
                hasVideo: !!videoElement,
                hasCanvas: !!canvasElement,
                hasLandmarker: !!handLandmarker
            })
            return
        }

        const ctx = canvasElement.getContext("2d")
        if (!ctx) {
            console.error("Could not get canvas context")
            return
        }

        // Check if video is ready
        if (videoElement.readyState < 4) {
            console.log("Video not ready yet, retrying...")
            requestAnimationFrame(detectHands)
            return
        }

        // Set canvas size to match video
        if (canvasElement.width !== videoElement.videoWidth || canvasElement.height !== videoElement.videoHeight) {
            canvasElement.width = videoElement.videoWidth
            canvasElement.height = videoElement.videoHeight
            console.log("Canvas resized to:", canvasElement.width, "x", canvasElement.height)
        }

        try {
            // Detect hands
            const startTimeMs = performance.now()
            const results = handLandmarker.detectForVideo(videoElement, startTimeMs)

            if (results.landmarks && results.landmarks.length > 0) {
                console.log("Hands detected:", results.landmarks.length)
                setHandLandmarks(results.landmarks)

                // Draw landmarks
                ctx.clearRect(0, 0, canvasElement.width, canvasElement.height)
                ctx.save()
                ctx.scale(-1, 1) // Mirror the canvas
                ctx.translate(-canvasElement.width, 0)

                for (const landmarks of results.landmarks) {
                    // Draw landmarks
                    ctx.fillStyle = "#FF0000"
                    for (const landmark of landmarks) {
                        ctx.beginPath()
                        ctx.arc(
                            landmark.x * canvasElement.width,
                            landmark.y * canvasElement.height,
                            3,
                            0,
                            2 * Math.PI
                        )
                        ctx.fill()
                    }
                }
                ctx.restore()
            } else {
                setHandLandmarks(null)
                ctx.clearRect(0, 0, canvasElement.width, canvasElement.height)
            }
        } catch (error) {
            console.error("Error in hand detection:", error)
            setHandLandmarks(null)
        }

        // Continue detection loop
        if (isDetecting) {
            requestAnimationFrame(detectHands)
        }
    }

    const value: HandDetectionContextType = {
        isInitialized,
        isDetecting,
        handLandmarks,
        startDetection,
        stopDetection,
        error
    }

    return (
        <HandDetectionContext.Provider value={value}>
            {children}
        </HandDetectionContext.Provider>
    )
} 