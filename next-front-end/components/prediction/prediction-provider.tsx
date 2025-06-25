"use client"
import React, { createContext, useContext, useState, ReactNode } from "react"

interface Prediction {
    label: string
    confidence: number
    timestamp: number
}

interface PredictionContextType {
    currentPrediction: Prediction | null
    isPredicting: boolean
    predictionHistory: Prediction[]
    startPrediction: () => void
    stopPrediction: () => void
    updatePrediction: (label: string, confidence: number) => void
    clearHistory: () => void
}

const PredictionContext = createContext<PredictionContextType | undefined>(undefined)

export function usePrediction() {
    const context = useContext(PredictionContext)
    if (context === undefined) {
        throw new Error("usePrediction must be used within a PredictionProvider")
    }
    return context
}

interface PredictionProviderProps {
    children: ReactNode
}

export function PredictionProvider({ children }: PredictionProviderProps) {
    const [currentPrediction, setCurrentPrediction] = useState<Prediction | null>(null)
    const [isPredicting, setIsPredicting] = useState(false)
    const [predictionHistory, setPredictionHistory] = useState<Prediction[]>([])

    const startPrediction = () => {
        setIsPredicting(true)
        setCurrentPrediction(null)
    }

    const stopPrediction = () => {
        setIsPredicting(false)
        setCurrentPrediction(null)
    }

    const updatePrediction = (label: string, confidence: number) => {
        const prediction: Prediction = {
            label,
            confidence,
            timestamp: Date.now()
        }

        setCurrentPrediction(prediction)
        setPredictionHistory(prev => [...prev.slice(-9), prediction]) // Keep last 10 predictions
    }

    const clearHistory = () => {
        setPredictionHistory([])
        setCurrentPrediction(null)
    }

    const value: PredictionContextType = {
        currentPrediction,
        isPredicting,
        predictionHistory,
        startPrediction,
        stopPrediction,
        updatePrediction,
        clearHistory
    }

    return (
        <PredictionContext.Provider value={value}>
            {children}
        </PredictionContext.Provider>
    )
} 