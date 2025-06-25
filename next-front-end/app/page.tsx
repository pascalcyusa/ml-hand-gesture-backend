"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import {
  Play,
  Plus,
  RotateCcw,
  Zap,
  Hand,
  Piano,
  Usb,
  Info,
  Video,
  Brain,
  Sparkles,
  Settings,
  Wifi,
  Camera,
  Eye,
  Target,
  StopCircle,
  Database,
} from "lucide-react"
import { toast } from "sonner"
import { HandDetectionProvider, useHandDetection } from "@/components/hand-detection/hand-detection-provider"
import { TrainingProvider, useTraining } from "@/components/training/training-provider"
import { PredictionProvider } from "@/components/prediction/prediction-provider"
import HandDetectionPanel from "@/components/hand-detection/hand-detection-panel"
import TrainingPanel from "@/components/training/training-panel"
import PredictionPanel from "@/components/prediction/prediction-panel"
import { PianoPanel } from "@/components/piano/piano-panel"
import { MotorPanel } from "@/components/motor/motor-panel"
import { AboutPanel } from "@/components/about/about-panel"
import { ConnectionStatus } from "@/components/connection/connection-status"

export default function HandPosePianoMachine() {
  const [classes, setClasses] = useState<string[]>([])
  const [isTraining, setIsTraining] = useState(false)

  const addClass = () => {
    const className = `Gesture ${classes.length + 1}`
    setClasses([...classes, className])
    toast.success(`Added new class: ${className}`, {
      description: "You can now start collecting samples for this gesture",
    })
  }

  const trainModel = () => {
    if (classes.length === 0) {
      toast.error("Cannot train model", {
        description: "Please add at least one class before training!",
      })
      return
    }
    setIsTraining(true)
    toast.loading("Training model...", {
      description: "This may take a few moments. Please wait.",
    })

    // Simulate training process
    setTimeout(() => {
      setIsTraining(false)
      toast.success("Model trained successfully!", {
        description: "Your hand pose model is ready for predictions.",
      })
    }, 3000)
  }

  const resetModel = () => {
    setClasses([])
    setIsTraining(false)
    toast.info("Model reset", {
      description: "All classes cleared. Ready to start fresh!",
    })
  }

  return (
    <HandDetectionProvider>
      <TrainingProvider>
        <PredictionProvider>
          <div className="min-h-screen bg-[#282828] text-[#ebdbb2]">
            {/* Header */}
            <div className="bg-gradient-to-r from-[#458588] to-[#83a598] text-[#282828] py-12 px-6">
              <div className="max-w-6xl mx-auto text-center">
                <div className="flex items-center justify-center gap-3 mb-4">
                  <Hand className="w-8 h-8" />
                  <Sparkles className="w-6 h-6" />
                  <Piano className="w-8 h-8" />
                </div>
                <h1 className="text-4xl md:text-5xl font-bold mb-4">Hand Pose Piano Machine</h1>
                <p className="text-lg md:text-xl opacity-90 max-w-3xl mx-auto">
                  Create music and motor motion with your hand gestures using machine learning!
                </p>
              </div>
            </div>

            {/* Connection Status */}
            <ConnectionStatus />

            {/* Main Content */}
            <div className="max-w-7xl mx-auto p-6 pt-12">
              <Tabs defaultValue="train" className="w-full">
                <div className="flex justify-center mb-12">
                  <TabsList className="bg-[#3c3836] border-[#504945] p-2 rounded-full h-auto">
                    <TabsTrigger
                      value="train"
                      className="data-[state=active]:bg-[#d79921] data-[state=active]:text-[#282828] text-[#ebdbb2] px-6 py-3 text-base font-semibold rounded-full transition-all duration-300"
                    >
                      <Brain className="w-4 h-4 mr-2" />
                      Training
                    </TabsTrigger>
                    <TabsTrigger
                      value="predict"
                      className="data-[state=active]:bg-[#d79921] data-[state=active]:text-[#282828] text-[#ebdbb2] px-6 py-3 text-base font-semibold rounded-full transition-all duration-300"
                    >
                      <Target className="w-4 h-4 mr-2" />
                      Prediction
                    </TabsTrigger>
                    <TabsTrigger
                      value="piano"
                      className="data-[state=active]:bg-[#d79921] data-[state=active]:text-[#282828] text-[#ebdbb2] px-6 py-3 text-base font-semibold rounded-full transition-all duration-300"
                    >
                      <Piano className="w-4 h-4 mr-2" />
                      Piano
                    </TabsTrigger>
                    <TabsTrigger
                      value="motor"
                      className="data-[state=active]:bg-[#d79921] data-[state=active]:text-[#282828] text-[#ebdbb2] px-6 py-3 text-base font-semibold rounded-full transition-all duration-300"
                    >
                      <Settings className="w-4 h-4 mr-2" />
                      Motors
                    </TabsTrigger>
                    <TabsTrigger
                      value="about"
                      className="data-[state=active]:bg-[#d79921] data-[state=active]:text-[#282828] text-[#ebdbb2] px-6 py-3 text-base font-semibold rounded-full transition-all duration-300"
                    >
                      <Info className="w-4 h-4 mr-2" />
                      About
                    </TabsTrigger>
                  </TabsList>
                </div>

                <TabsContent value="train" className="mt-8">
                  <div className="max-w-7xl mx-auto">
                    <CombinedTrainingPanel />
                  </div>
                </TabsContent>

                <TabsContent value="predict" className="mt-8">
                  <div className="max-w-4xl mx-auto">
                    <PredictionPanel />
                  </div>
                </TabsContent>

                <TabsContent value="piano" className="mt-8">
                  <PianoPanel
                    classes={classes}
                    isConnected={false}
                  />
                </TabsContent>

                <TabsContent value="motor" className="mt-8">
                  <MotorPanel
                    isConnected={false}
                    classes={classes}
                  />
                </TabsContent>

                <TabsContent value="about" className="mt-8">
                  <AboutPanel />
                </TabsContent>
              </Tabs>
            </div>
          </div>
        </PredictionProvider>
      </TrainingProvider>
    </HandDetectionProvider>
  )
}

// Combined Training Panel Component
function CombinedTrainingPanel() {
  const { isInitialized, isDetecting, handLandmarks, startDetection, stopDetection, error } = useHandDetection()
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
  const [inputClass, setInputClass] = useState("")

  // Auto-capture samples when collecting and hand is detected
  useEffect(() => {
    if (isCollecting && isDetecting && handLandmarks && handLandmarks.length > 0 && currentClass) {
      toast.success("Hand detected! Collecting samples...")
      const interval = setInterval(() => {
        if (handLandmarks && handLandmarks.length > 0) {
          addSample(handLandmarks[0], currentClass)
        }
      }, 500)
      return () => clearInterval(interval)
    }
    if (isCollecting && isDetecting && (!handLandmarks || handLandmarks.length === 0)) {
      toast.warning("No hand detected. Please show your hand to the camera.")
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
      toast.error("Please enter a class name")
      return
    }
    if (!handLandmarks || handLandmarks.length === 0) {
      toast.warning("No hand detected. Please show your hand to the camera.")
      return
    }
    addSample(handLandmarks[0], currentClass)
    toast.success("Sample captured!")
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
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
      {/* Left Side - Camera Feed */}
      <div className="space-y-4">
        <h3 className="text-xl font-semibold text-[#fabd2f]">Camera Feed</h3>

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

        {/* Camera Controls */}
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

      {/* Right Side - Training Controls */}
      <div className="space-y-4">
        <h3 className="text-xl font-semibold text-[#fabd2f]">Training Data Collection</h3>

        {/* Class Input and Collection Controls */}
        <div className="space-y-4">
          <div>
            <input
              type="text"
              placeholder="Enter gesture class name (e.g., 'fist', 'open', 'point')"
              value={inputClass}
              onChange={(e) => setInputClass(e.target.value)}
              className="w-full px-3 py-2 border border-gray-600 rounded bg-gray-800 text-white"
              disabled={isCollecting}
            />
          </div>

          <div className="flex gap-2">
            {!isCollecting ? (
              <button
                onClick={handleStartCollecting}
                disabled={!inputClass.trim() || !isDetecting}
                className="px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded font-semibold disabled:bg-gray-600 disabled:cursor-not-allowed flex items-center gap-2"
              >
                <Camera className="w-5 h-5" /> Start Collecting
              </button>
            ) : (
              <button
                onClick={handleStopCollecting}
                className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded font-semibold flex items-center gap-2"
              >
                <StopCircle className="w-5 h-5" /> Stop Collecting
              </button>
            )}

            <button
              onClick={handleCaptureSample}
              disabled={!currentClass || !isDetecting || !handLandmarks || handLandmarks.length === 0}
              className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded font-semibold disabled:bg-gray-600 disabled:cursor-not-allowed flex items-center gap-2"
            >
              <Database className="w-5 h-5" /> Capture Sample
            </button>
          </div>
        </div>

        {/* Sample Counts */}
        <div className="border border-gray-700 rounded p-4 bg-[#282828] shadow-lg">
          <h4 className="font-medium mb-3 text-[#fabd2f] flex items-center gap-2"><Database className="w-5 h-5" /> Training Data Summary</h4>
          <div className="flex gap-4 mb-2">
            <span className="inline-block bg-[#3c3836] text-[#fabd2f] px-4 py-1 rounded-full font-semibold text-lg">Total samples: {getTotalSamples()}</span>
            <span className="inline-block bg-[#3c3836] text-[#fabd2f] px-4 py-1 rounded-full font-semibold text-lg">Classes: {Object.keys(trainingData).length}</span>
          </div>

          {Object.keys(trainingData).length > 0 && (
            <div className="mt-4">
              <h5 className="font-medium mb-2">Samples per class:</h5>
              <div className="space-y-2">
                {Object.keys(trainingData).map(className => (
                  <div key={className} className="flex justify-between items-center p-2 bg-gray-800 rounded">
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
            className="w-full px-4 py-2 bg-red-800 hover:bg-red-900 text-white rounded font-semibold"
          >
            Clear All Training Data
          </button>
        )}
      </div>
    </div>
  )
}