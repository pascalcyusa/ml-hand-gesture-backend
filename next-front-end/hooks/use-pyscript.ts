import { useState, useCallback } from 'react'

interface PyScriptResponse {
    success: boolean
    message?: string
    error?: string
}

export function usePyScript() {
    const [isLoading, setIsLoading] = useState(false)
    const [error, setError] = useState<string | null>(null)

    const callPyScript = useCallback(async (action: string, data?: any): Promise<PyScriptResponse> => {
        setIsLoading(true)
        setError(null)

        try {
            // First try to call the Python function directly if available
            if (typeof window !== 'undefined' && window.pyPlayNote) {
                switch (action) {
                    case 'playNote':
                        if (window.pyPlayNote && data?.note && data?.duration) {
                            window.pyPlayNote(data.note, data.duration)
                            return { success: true, message: `Playing note: ${data.note}` }
                        }
                        break
                    case 'stopAll':
                        if (window.pyStopAll) {
                            window.pyStopAll()
                            return { success: true, message: 'Stopped all audio' }
                        }
                        break
                    case 'stopAllMotors':
                        if (window.pyStopAllMotors) {
                            window.pyStopAllMotors()
                            return { success: true, message: 'Stopped all motors' }
                        }
                        break
                }
            }

            // Fallback to API route if Python functions aren't available
            const response = await fetch('/api/pyscript', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ action, data }),
            })

            const result = await response.json()

            if (!result.success) {
                throw new Error(result.error || 'Unknown error')
            }

            return result
        } catch (err) {
            const errorMessage = err instanceof Error ? err.message : 'Unknown error occurred'
            setError(errorMessage)
            return { success: false, error: errorMessage }
        } finally {
            setIsLoading(false)
        }
    }, [])

    const playNote = useCallback((note: string, duration: string) => {
        return callPyScript('playNote', { note, duration })
    }, [callPyScript])

    const stopAll = useCallback(() => {
        return callPyScript('stopAll')
    }, [callPyScript])

    const stopAllMotors = useCallback(() => {
        return callPyScript('stopAllMotors')
    }, [callPyScript])

    return {
        isLoading,
        error,
        callPyScript,
        playNote,
        stopAll,
        stopAllMotors,
    }
} 