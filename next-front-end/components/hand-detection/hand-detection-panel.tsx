"use client"
import React from "react"
import { useHandDetection } from "./hand-detection-provider"

export default function HandDetectionPanel() {
    const {
        isInitialized,
        isDetecting,
        handLandmarks,
        startDetection,
        stopDetection,
        error,
    } = useHandDetection()

    return (
        <div className="flex flex-col items-center gap-4 p-4">
            <div className="relative w-[640px] h-[480px]">
                <video
                    id="webcam"
                    className="absolute top-0 left-0 w-full h-full object-cover rounded-lg border border-gray-700"
                    width={640}
                    height={480}
                    autoPlay
                    playsInline
                    muted
                />
                <canvas
                    id="pose-canvas"
                    className="absolute top-0 left-0 w-full h-full pointer-events-none"
                    width={640}
                    height={480}
                />
            </div>
            <div className="flex flex-row items-center gap-4">
                <button
                    className={`px-4 py-2 rounded font-semibold transition-colors ${isDetecting
                            ? "bg-red-600 hover:bg-red-700 text-white"
                            : isInitialized
                                ? "bg-green-600 hover:bg-green-700 text-white"
                                : "bg-gray-400 text-gray-700 cursor-not-allowed"
                        }`}
                    onClick={isDetecting ? stopDetection : startDetection}
                    disabled={!isInitialized}
                >
                    {isDetecting ? "Stop Detection" : "Start Detection"}
                </button>
                <span className="text-sm text-gray-400">
                    {error
                        ? `Error: ${error}`
                        : !isInitialized
                            ? "Initializing..."
                            : isDetecting
                                ? handLandmarks && handLandmarks.length > 0
                                    ? `Hands detected: ${handLandmarks.length}`
                                    : "Detecting hands..."
                                : "Idle"}
                </span>
            </div>
        </div>
    )
} 