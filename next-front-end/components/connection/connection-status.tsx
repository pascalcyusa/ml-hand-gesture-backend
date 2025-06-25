"use client"

import { Button } from "@/components/ui/button"
import { Camera, Square } from "lucide-react"
import { useHandDetection } from "@/components/hand-detection/hand-detection-provider"
import { toast } from "sonner"

export function ConnectionStatus() {
    const { isInitialized, isDetecting, startDetection, stopDetection, error } = useHandDetection()

    const handleCameraToggle = async () => {
        console.log("Camera button clicked!")
        console.log("Current state:", { isInitialized, isDetecting, error })

        try {
            if (isDetecting) {
                console.log("Stopping detection...")
                stopDetection()
                toast.info("Camera deactivated", {
                    description: "Hand detection is now paused",
                })
            } else {
                if (!isInitialized) {
                    console.log("Not initialized yet...")
                    toast.error("Hand detection not ready", {
                        description: "Please wait for initialization to complete",
                    })
                    return
                }
                console.log("Starting detection...")
                await startDetection()
                toast.success("Camera activated", {
                    description: "Hand detection is now active",
                })
            }
        } catch (err) {
            console.error("Camera toggle error:", err)
            toast.error("Failed to toggle camera", {
                description: error || "Please check camera permissions",
            })
        }
    }

    return (
        <div className="fixed top-6 right-6 z-50 flex gap-3">
            {/* Camera Toggle Button */}
            <Button
                onClick={handleCameraToggle}
                className={`rounded-full w-16 h-16 p-0 shadow-lg transition-all duration-300 ${isDetecting
                    ? "bg-[#689d6a] hover:bg-[#8ec07c] text-[#282828]"
                    : "bg-[#cc241d] hover:bg-[#fb4934] text-[#ebdbb2]"
                    }`}
                title={isDetecting ? "Stop Camera" : "Start Camera"}
                disabled={!isInitialized && !isDetecting}
            >
                {isDetecting ? <Square className="w-6 h-6" /> : <Camera className="w-6 h-6" />}
            </Button>

            {/* Device Connection Button - Disabled for now */}
            <Button
                className="rounded-full w-16 h-16 p-0 shadow-lg transition-all duration-300 opacity-50 cursor-not-allowed bg-[#cc241d] hover:bg-[#fb4934] text-[#ebdbb2]"
                title="SPIKE Prime connection (coming soon)"
                disabled
            >
                <div className="w-6 h-6 flex items-center justify-center">
                    <span className="text-xs">SP</span>
                </div>
            </Button>
        </div>
    )
} 