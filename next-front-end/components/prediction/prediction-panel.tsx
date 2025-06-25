"use client"
import React from "react"
import { usePrediction } from "./prediction-provider"
import { useHandDetection } from "../hand-detection/hand-detection-provider"
import { toast } from "sonner"
import { Play, Square, History, Video, Target, Brain } from "lucide-react"

export default function PredictionPanel() {
    const {
        currentPrediction,
        isPredicting,
        predictionHistory,
        startPrediction,
        stopPrediction,
        clearHistory
    } = usePrediction()

    const { isDetecting, handLandmarks, error, isInitialized } = useHandDetection()

    const getConfidenceColor = (confidence: number) => {
        if (confidence >= 0.8) return "text-green-400"
        if (confidence >= 0.6) return "text-yellow-400"
        return "text-red-400"
    }

    const getConfidenceBarColor = (confidence: number) => {
        if (confidence >= 0.8) return "bg-green-500"
        if (confidence >= 0.6) return "bg-yellow-500"
        return "bg-red-500"
    }

    const handleStartPrediction = () => {
        if (!isDetecting) {
            toast.error("Hand detection not active", {
                description: "Please start the camera first"
            })
            return
        }
        startPrediction()
        toast.success("Prediction started!", {
            description: "Show your hand to see predictions"
        })
    }

    const handleStopPrediction = () => {
        stopPrediction()
        toast.info("Prediction stopped")
    }

    const handleClearHistory = () => {
        clearHistory()
        toast.success("Prediction history cleared")
    }

    return (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* Left Side - Camera Feed */}
            <div className="space-y-4">
                <h3 className="text-xl font-semibold text-[#fabd2f] flex items-center gap-2">
                    <Video className="w-5 h-5" />
                    Camera Feed
                </h3>

                <div className="relative w-full aspect-video bg-[#1d2021] rounded-3xl flex items-center justify-center border-2 border-dashed border-[#504945] overflow-hidden">
                    {/* Video and Canvas elements - always present but controlled by detection state */}
                    <video
                        id="webcam"
                        autoPlay
                        playsInline
                        className={`absolute inset-0 w-full h-full object-cover transition-opacity duration-300 ${isDetecting ? 'opacity-100' : 'opacity-0'
                            }`}
                        style={{ transform: "scaleX(-1)" }}
                    />
                    <canvas
                        id="pose-canvas"
                        className={`absolute inset-0 w-full h-full transition-opacity duration-300 ${isDetecting ? 'opacity-100' : 'opacity-0'
                            }`}
                        style={{ transform: "scaleX(-1)" }}
                    />

                    {/* Live indicator */}
                    {isDetecting && (
                        <div className="absolute bottom-4 right-4 bg-black/50 text-white px-3 py-1 rounded-full text-sm">
                            Live
                        </div>
                    )}

                    {/* Placeholder when not detecting */}
                    {!isDetecting && (
                        <div className="text-center text-[#a89984]">
                            <Video className="w-12 h-12 mx-auto mb-2 opacity-50" />
                            <p>Camera feed will appear here</p>
                            <p className="text-sm mt-2">Click the camera button to start</p>
                        </div>
                    )}
                </div>

                {/* Camera Status */}
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                        <span className="text-sm text-gray-400">
                            {error
                                ? `Error: ${error}`
                                : !isInitialized
                                    ? "Initializing MediaPipe..."
                                    : isDetecting
                                        ? "Camera active - show your hand to detect"
                                        : "Click the camera button to start detection"}
                        </span>
                    </div>
                </div>
            </div>

            {/* Right Side - Prediction Controls */}
            <div className="space-y-4">
                <h3 className="text-xl font-semibold text-[#fabd2f] flex items-center gap-2">
                    <Target className="w-5 h-5" />
                    Live Prediction
                </h3>

                {/* Prediction Controls */}
                <div className="flex gap-2">
                    {!isPredicting ? (
                        <button
                            onClick={handleStartPrediction}
                            disabled={!isDetecting}
                            className="px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded font-semibold disabled:bg-gray-600 disabled:cursor-not-allowed flex items-center gap-2"
                        >
                            <Play className="w-5 h-5" /> Start Prediction
                        </button>
                    ) : (
                        <button
                            onClick={handleStopPrediction}
                            className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded font-semibold flex items-center gap-2"
                        >
                            <Square className="w-5 h-5" /> Stop Prediction
                        </button>
                    )}

                    {predictionHistory.length > 0 && (
                        <button
                            onClick={handleClearHistory}
                            className="px-4 py-2 bg-gray-600 hover:bg-gray-700 text-white rounded font-semibold flex items-center gap-2"
                        >
                            <History className="w-5 h-5" /> Clear History
                        </button>
                    )}
                </div>

                {/* Current Prediction Display */}
                <div className="border border-gray-700 rounded p-4 bg-[#282828] shadow-lg">
                    <h4 className="font-medium mb-3 text-[#fabd2f] flex items-center gap-2">
                        <Brain className="w-5 h-5" />
                        Current Prediction
                    </h4>

                    {!isPredicting ? (
                        <div className="text-gray-400 text-center py-8">
                            Click "Start Prediction" to begin
                        </div>
                    ) : !isDetecting ? (
                        <div className="text-red-400 text-center py-8">
                            No hand detected. Show your hand to the camera.
                        </div>
                    ) : currentPrediction ? (
                        <div className="space-y-3">
                            <div className="text-center">
                                <div className="text-2xl font-bold text-white mb-2">
                                    {currentPrediction.label}
                                </div>
                                <div className={`text-lg font-semibold ${getConfidenceColor(currentPrediction.confidence)}`}>
                                    {Math.round(currentPrediction.confidence * 100)}% confidence
                                </div>
                            </div>

                            {/* Confidence Bar */}
                            <div className="w-full bg-gray-700 rounded-full h-3">
                                <div
                                    className={`h-3 rounded-full transition-all duration-300 ${getConfidenceBarColor(currentPrediction.confidence)}`}
                                    style={{ width: `${currentPrediction.confidence * 100}%` }}
                                />
                            </div>
                        </div>
                    ) : (
                        <div className="text-yellow-400 text-center py-8">
                            Analyzing hand pose...
                        </div>
                    )}
                </div>

                {/* Prediction History */}
                {predictionHistory.length > 0 && (
                    <div className="border border-gray-700 rounded p-4 bg-[#282828] shadow-lg">
                        <h4 className="font-medium mb-3 text-[#fabd2f] flex items-center gap-2">
                            <History className="w-5 h-5" />
                            Recent Predictions
                        </h4>
                        <div className="space-y-2 max-h-48 overflow-y-auto">
                            {predictionHistory.slice().reverse().map((prediction, index) => (
                                <div key={index} className="flex justify-between items-center p-2 bg-gray-800 rounded">
                                    <div>
                                        <span className="font-medium text-white">{prediction.label}</span>
                                        <span className={`ml-2 text-sm ${getConfidenceColor(prediction.confidence)}`}>
                                            {Math.round(prediction.confidence * 100)}%
                                        </span>
                                    </div>
                                    <span className="text-xs text-gray-400">
                                        {new Date(prediction.timestamp).toLocaleTimeString()}
                                    </span>
                                </div>
                            ))}
                        </div>
                    </div>
                )}
            </div>
        </div>
    )
} 