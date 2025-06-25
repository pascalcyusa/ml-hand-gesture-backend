"use client"
import React, { createContext, useContext, useState, ReactNode } from "react"

interface TrainingSample {
    landmarks: any[]
    label: string
    timestamp: number
}

interface TrainingContextType {
    trainingData: { [label: string]: TrainingSample[] }
    currentClass: string
    isCollecting: boolean
    setCurrentClass: (className: string) => void
    addSample: (landmarks: any[], label: string) => void
    clearClass: (className: string) => void
    clearAllData: () => void
    getSampleCount: (className: string) => number
    getTotalSamples: () => number
    startCollecting: () => void
    stopCollecting: () => void
}

const TrainingContext = createContext<TrainingContextType | undefined>(undefined)

export function useTraining() {
    const context = useContext(TrainingContext)
    if (context === undefined) {
        throw new Error("useTraining must be used within a TrainingProvider")
    }
    return context
}

interface TrainingProviderProps {
    children: ReactNode
}

export function TrainingProvider({ children }: TrainingProviderProps) {
    const [trainingData, setTrainingData] = useState<{ [label: string]: TrainingSample[] }>({})
    const [currentClass, setCurrentClass] = useState("")
    const [isCollecting, setIsCollecting] = useState(false)

    const addSample = (landmarks: any[], label: string) => {
        if (!label.trim()) return

        const sample: TrainingSample = {
            landmarks,
            label: label.trim(),
            timestamp: Date.now()
        }

        setTrainingData(prev => ({
            ...prev,
            [label]: [...(prev[label] || []), sample]
        }))
    }

    const clearClass = (className: string) => {
        setTrainingData(prev => {
            const newData = { ...prev }
            delete newData[className]
            return newData
        })
    }

    const clearAllData = () => {
        setTrainingData({})
    }

    const getSampleCount = (className: string) => {
        return trainingData[className]?.length || 0
    }

    const getTotalSamples = () => {
        return Object.values(trainingData).reduce((total, samples) => total + samples.length, 0)
    }

    const startCollecting = () => {
        setIsCollecting(true)
    }

    const stopCollecting = () => {
        setIsCollecting(false)
    }

    const value: TrainingContextType = {
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
    }

    return (
        <TrainingContext.Provider value={value}>
            {children}
        </TrainingContext.Provider>
    )
} 