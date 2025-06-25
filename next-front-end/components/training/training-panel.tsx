"use client"
import React, { useState, useEffect } from "react"
import { useTraining } from "./training-provider"
import { useHandDetection } from "../hand-detection/hand-detection-provider"

export default function TrainingPanel() {
    const {
        trainingData,
        currentClass,
        isCollecting,
        setCurrentClass,
        addSample,
        clearClass,
        clearAllData,
        getSampleCount,
        getTotalSamples,
        startCollecting,
        stopCollecting
    } = useTraining()

    const { handLandmarks, isDetecting } = useHandDetection()
    const [inputClass, setInputClass] = useState("")

    // Auto-capture samples when collecting and hand is detected
    useEffect(() => {
        if (isCollecting && isDetecting && handLandmarks && handLandmarks.length > 0 && currentClass) {
            const interval = setInterval(() => {
                if (handLandmarks && handLandmarks.length > 0) {
                    addSample(handLandmarks[0], currentClass)
                }
            }, 500) // Capture every 500ms

            return () => clearInterval(interval)
        }
    }, [isCollecting, isDetecting, handLandmarks, currentClass, addSample])

    const handleStartCollecting = () => {
        if (!inputClass.trim()) {
            alert("Please enter a class name")
            return
        }
        setCurrentClass(inputClass.trim())
        startCollecting()
    }

    const handleStopCollecting = () => {
        stopCollecting()
    }

    const handleCaptureSample = () => {
        if (!currentClass.trim()) {
            alert("Please enter a class name")
            return
        }
        if (!handLandmarks || handLandmarks.length === 0) {
            alert("No hand detected. Please show your hand to the camera.")
            return
        }
        addSample(handLandmarks[0], currentClass)
    }

    const handleClearClass = (className: string) => {
        if (confirm(`Are you sure you want to clear all samples for "${className}"?`)) {
            clearClass(className)
        }
    }

    const handleClearAll = () => {
        if (confirm("Are you sure you want to clear all training data?")) {
            clearAllData()
        }
    }

    return (
        <div className="flex flex-col gap-4 p-4">
            <h3 className="text-lg font-semibold">Training Data Collection</h3>

            {/* Class Input and Collection Controls */}
            <div className="flex flex-col gap-2">
                <div className="flex gap-2">
                    <input
                        type="text"
                        placeholder="Enter gesture class name (e.g., 'fist', 'open', 'point')"
                        value={inputClass}
                        onChange={(e) => setInputClass(e.target.value)}
                        className="flex-1 px-3 py-2 border border-gray-600 rounded bg-gray-800 text-white"
                        disabled={isCollecting}
                    />
                </div>

                <div className="flex gap-2">
                    {!isCollecting ? (
                        <button
                            onClick={handleStartCollecting}
                            disabled={!inputClass.trim() || !isDetecting}
                            className="px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded font-semibold disabled:bg-gray-600 disabled:cursor-not-allowed"
                        >
                            Start Collecting
                        </button>
                    ) : (
                        <button
                            onClick={handleStopCollecting}
                            className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded font-semibold"
                        >
                            Stop Collecting
                        </button>
                    )}

                    <button
                        onClick={handleCaptureSample}
                        disabled={!currentClass || !isDetecting || !handLandmarks || handLandmarks.length === 0}
                        className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded font-semibold disabled:bg-gray-600 disabled:cursor-not-allowed"
                    >
                        Capture Sample
                    </button>
                </div>
            </div>

            {/* Status Display */}
            <div className="text-sm text-gray-400">
                {isCollecting ? (
                    <span className="text-green-400">
                        Collecting samples for "{currentClass}"...
                        {handLandmarks && handLandmarks.length > 0 ? " Hand detected" : " No hand detected"}
                    </span>
                ) : (
                    <span>
                        {isDetecting ? "Ready to collect samples" : "Start hand detection first"}
                    </span>
                )}
            </div>

            {/* Sample Counts */}
            <div className="border border-gray-700 rounded p-3">
                <h4 className="font-medium mb-2">Training Data Summary</h4>
                <div className="text-sm">
                    <p>Total samples: {getTotalSamples()}</p>
                    <p>Classes: {Object.keys(trainingData).length}</p>
                </div>

                {Object.keys(trainingData).length > 0 && (
                    <div className="mt-3">
                        <h5 className="font-medium mb-2">Samples per class:</h5>
                        <div className="space-y-1">
                            {Object.keys(trainingData).map(className => (
                                <div key={className} className="flex justify-between items-center">
                                    <span>{className}: {getSampleCount(className)} samples</span>
                                    <button
                                        onClick={() => handleClearClass(className)}
                                        className="text-red-400 hover:text-red-300 text-xs"
                                    >
                                        Clear
                                    </button>
                                </div>
                            ))}
                        </div>
                    </div>
                )}
            </div>

            {/* Clear All Button */}
            {getTotalSamples() > 0 && (
                <button
                    onClick={handleClearAll}
                    className="px-4 py-2 bg-red-800 hover:bg-red-900 text-white rounded font-semibold"
                >
                    Clear All Training Data
                </button>
            )}
        </div>
    )
} 