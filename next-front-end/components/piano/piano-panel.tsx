"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Switch } from "@/components/ui/switch"
import { Label } from "@/components/ui/label"
import { Piano, Play, Square, Music, Plus } from "lucide-react"
import { toast } from "sonner"
import { usePyScript } from "@/hooks/use-pyscript"

interface PianoPanelProps {
    classes: string[]
    isConnected: boolean
}

interface NoteSequence {
    id: string
    className: string
    notes: string[]
    durations: string[]
    isEnabled: boolean
}

const noteOptions = [
    'C3', 'C#3', 'D3', 'D#3', 'E3', 'F3', 'F#3', 'G3', 'G#3', 'A3', 'A#3', 'B3',
    'C4', 'C#4', 'D4', 'D#4', 'E4', 'F4', 'F#4', 'G4', 'G#4', 'A4', 'A#4', 'B4',
    'C5', 'C#5', 'D5', 'D#5', 'E5', 'F5', 'F#5', 'G5', 'G#5', 'A5', 'A#5', 'B5'
]

const durationOptions = ['very short', 'short', 'medium', 'long', 'very long']

export function PianoPanel({ classes, isConnected }: PianoPanelProps) {
    const [sequences, setSequences] = useState<NoteSequence[]>([])
    const [isPianoEnabled, setIsPianoEnabled] = useState(false)
    const [isPlaying, setIsPlaying] = useState(false)
    const { playNote, stopAll, isLoading: isPyScriptLoading } = usePyScript()

    const addSequence = () => {
        if (classes.length === 0) {
            toast.error("No classes available", {
                description: "Please create and train some hand pose classes first",
            })
            return
        }

        const newSequence: NoteSequence = {
            id: Date.now().toString(),
            className: classes[0],
            notes: ['C4'],
            durations: ['medium'],
            isEnabled: true
        }

        setSequences([...sequences, newSequence])
        toast.success("New sequence added", {
            description: "Configure the notes and durations for this gesture",
        })
    }

    const updateSequence = (id: string, updates: Partial<NoteSequence>) => {
        setSequences(prev => prev.map(seq =>
            seq.id === id ? { ...seq, ...updates } : seq
        ))
    }

    const deleteSequence = (id: string) => {
        setSequences(prev => prev.filter(seq => seq.id !== id))
        toast.info("Sequence deleted")
    }

    const addNote = (sequenceId: string) => {
        setSequences(prev => prev.map(seq => {
            if (seq.id === sequenceId) {
                return {
                    ...seq,
                    notes: [...seq.notes, 'C4'],
                    durations: [...seq.durations, 'medium']
                }
            }
            return seq
        }))
    }

    const removeNote = (sequenceId: string, noteIndex: number) => {
        setSequences(prev => prev.map(seq => {
            if (seq.id === sequenceId) {
                const newNotes = [...seq.notes]
                const newDurations = [...seq.durations]
                newNotes.splice(noteIndex, 1)
                newDurations.splice(noteIndex, 1)
                return { ...seq, notes: newNotes, durations: newDurations }
            }
            return seq
        }))
    }

    const testSequence = async (sequence: NoteSequence) => {
        if (!sequence.isEnabled) {
            toast.error("Sequence is disabled", {
                description: "Enable the sequence to test it",
            })
            return
        }

        setIsPlaying(true)
        toast.loading("Playing sequence...", {
            description: `Playing ${sequence.notes.length} notes`,
        })

        try {
            // Play the sequence
            for (let i = 0; i < sequence.notes.length; i++) {
                const note = sequence.notes[i]
                const duration = sequence.durations[i]

                // Call the Python function via our hook
                const result = await playNote(note, duration)

                if (!result.success) {
                    throw new Error(result.error || 'Failed to play note')
                }

                // Wait for the note duration
                const durationMs = {
                    'very short': 100,
                    'short': 200,
                    'medium': 500,
                    'long': 1000,
                    'very long': 2000
                }[duration] || 500

                await new Promise(resolve => setTimeout(resolve, durationMs))
            }

            toast.success("Sequence played successfully!")
        } catch (error) {
            toast.error("Failed to play sequence", {
                description: error instanceof Error ? error.message : "Unknown error",
            })
        } finally {
            setIsPlaying(false)
        }
    }

    const testAllSequences = async () => {
        const enabledSequences = sequences.filter(seq => seq.isEnabled)
        if (enabledSequences.length === 0) {
            toast.error("No enabled sequences", {
                description: "Enable at least one sequence to test",
            })
            return
        }

        setIsPlaying(true)
        toast.loading("Playing all sequences...", {
            description: `Playing ${enabledSequences.length} sequences`,
        })

        try {
            for (const sequence of enabledSequences) {
                await testSequence(sequence)
                await new Promise(resolve => setTimeout(resolve, 500)) // Pause between sequences
            }
            toast.success("All sequences played!")
        } catch (error) {
            toast.error("Failed to play all sequences", {
                description: error instanceof Error ? error.message : "Unknown error",
            })
        } finally {
            setIsPlaying(false)
        }
    }

    const stopAllSounds = async () => {
        try {
            const result = await stopAll()
            if (result.success) {
                toast.success("All sounds stopped")
            } else {
                throw new Error(result.error || 'Failed to stop sounds')
            }
        } catch (error) {
            toast.error("Failed to stop sounds", {
                description: error instanceof Error ? error.message : "Unknown error",
            })
        }
        setIsPlaying(false)
    }

    return (
        <Card className="bg-[#3c3836] border-[#504945] rounded-3xl">
            <CardHeader>
                <CardTitle className="text-[#fabd2f] flex items-center gap-2">
                    <Piano className="w-6 h-6" />
                    Piano Player
                </CardTitle>
                <CardDescription className="text-[#a89984]">
                    Use your trained hand poses to play the piano and create beautiful music.
                </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
                {/* Controls */}
                <div className="flex items-center justify-between p-4 bg-[#1d2021] rounded-2xl">
                    <div className="flex items-center space-x-4">
                        <div className="flex items-center space-x-2">
                            <Switch
                                id="piano-enabled"
                                checked={isPianoEnabled}
                                onCheckedChange={setIsPianoEnabled}
                            />
                            <Label htmlFor="piano-enabled" className="text-[#ebdbb2]">
                                Enable Piano Player
                            </Label>
                        </div>
                        {isPyScriptLoading && (
                            <Badge variant="secondary" className="bg-[#d79921] text-[#282828]">
                                Loading PyScript...
                            </Badge>
                        )}
                    </div>
                    <div className="flex gap-2">
                        <Button
                            onClick={testAllSequences}
                            disabled={!isPianoEnabled || isPlaying || sequences.length === 0 || isPyScriptLoading}
                            className="bg-[#689d6a] hover:bg-[#8ec07c] text-[#282828] rounded-full"
                        >
                            <Play className="w-4 h-4 mr-2" />
                            Test All
                        </Button>
                        <Button
                            onClick={stopAllSounds}
                            disabled={!isPlaying || isPyScriptLoading}
                            variant="destructive"
                            className="bg-[#cc241d] hover:bg-[#fb4934] text-[#ebdbb2] rounded-full"
                        >
                            <Square className="w-4 h-4 mr-2" />
                            Stop All
                        </Button>
                    </div>
                </div>

                {/* Sequences */}
                <div className="space-y-4">
                    <div className="flex items-center justify-between">
                        <h3 className="text-lg font-semibold text-[#fabd2f]">Note Sequences</h3>
                        <Button
                            onClick={addSequence}
                            disabled={classes.length === 0}
                            className="bg-[#458588] hover:bg-[#83a598] text-[#282828] rounded-full"
                        >
                            <Music className="w-4 h-4 mr-2" />
                            Add Sequence
                        </Button>
                    </div>

                    {sequences.length === 0 ? (
                        <div className="text-center py-12 text-[#a89984]">
                            <Piano className="w-16 h-16 mx-auto mb-4 opacity-50" />
                            <p className="text-lg">No sequences configured yet</p>
                            <p className="text-sm mt-2">Create sequences to map hand gestures to musical notes</p>
                        </div>
                    ) : (
                        <div className="space-y-4">
                            {sequences.map((sequence) => (
                                <Card key={sequence.id} className="bg-[#1d2021] border-[#504945]">
                                    <CardContent className="p-4">
                                        <div className="flex items-center justify-between mb-4">
                                            <div className="flex items-center gap-4">
                                                <Select
                                                    value={sequence.className}
                                                    onValueChange={(value) => updateSequence(sequence.id, { className: value })}
                                                >
                                                    <SelectTrigger className="w-40 bg-[#3c3836] border-[#504945] text-[#ebdbb2]">
                                                        <SelectValue />
                                                    </SelectTrigger>
                                                    <SelectContent className="bg-[#3c3836] border-[#504945]">
                                                        {classes.map((className) => (
                                                            <SelectItem key={className} value={className}>
                                                                {className}
                                                            </SelectItem>
                                                        ))}
                                                    </SelectContent>
                                                </Select>
                                                <div className="flex items-center space-x-2">
                                                    <Switch
                                                        checked={sequence.isEnabled}
                                                        onCheckedChange={(checked) => updateSequence(sequence.id, { isEnabled: checked })}
                                                    />
                                                    <Label className="text-[#ebdbb2] text-sm">Enabled</Label>
                                                </div>
                                            </div>
                                            <div className="flex gap-2">
                                                <Button
                                                    onClick={() => testSequence(sequence)}
                                                    disabled={!sequence.isEnabled || isPlaying || isPyScriptLoading}
                                                    size="sm"
                                                    className="bg-[#689d6a] hover:bg-[#8ec07c] text-[#282828] rounded-full"
                                                >
                                                    <Play className="w-3 h-3 mr-1" />
                                                    Test
                                                </Button>
                                                <Button
                                                    onClick={() => deleteSequence(sequence.id)}
                                                    variant="destructive"
                                                    size="sm"
                                                    className="bg-[#cc241d] hover:bg-[#fb4934] text-[#ebdbb2] rounded-full"
                                                >
                                                    Delete
                                                </Button>
                                            </div>
                                        </div>

                                        {/* Notes */}
                                        <div className="space-y-2">
                                            <div className="flex items-center justify-between">
                                                <Label className="text-[#ebdbb2] text-sm">Notes:</Label>
                                                <Button
                                                    onClick={() => addNote(sequence.id)}
                                                    size="sm"
                                                    className="bg-[#458588] hover:bg-[#83a598] text-[#282828] rounded-full"
                                                >
                                                    <Plus className="w-3 h-3 mr-1" />
                                                    Add Note
                                                </Button>
                                            </div>
                                            <div className="grid grid-cols-2 gap-2">
                                                {sequence.notes.map((note, index) => (
                                                    <div key={index} className="flex gap-2">
                                                        <Select
                                                            value={note}
                                                            onValueChange={(value) => {
                                                                const newNotes = [...sequence.notes]
                                                                newNotes[index] = value
                                                                updateSequence(sequence.id, { notes: newNotes })
                                                            }}
                                                        >
                                                            <SelectTrigger className="flex-1 bg-[#3c3836] border-[#504945] text-[#ebdbb2]">
                                                                <SelectValue />
                                                            </SelectTrigger>
                                                            <SelectContent className="bg-[#3c3836] border-[#504945]">
                                                                {noteOptions.map((noteOption) => (
                                                                    <SelectItem key={noteOption} value={noteOption}>
                                                                        {noteOption}
                                                                    </SelectItem>
                                                                ))}
                                                            </SelectContent>
                                                        </Select>
                                                        <Select
                                                            value={sequence.durations[index]}
                                                            onValueChange={(value) => {
                                                                const newDurations = [...sequence.durations]
                                                                newDurations[index] = value
                                                                updateSequence(sequence.id, { durations: newDurations })
                                                            }}
                                                        >
                                                            <SelectTrigger className="w-24 bg-[#3c3836] border-[#504945] text-[#ebdbb2]">
                                                                <SelectValue />
                                                            </SelectTrigger>
                                                            <SelectContent className="bg-[#3c3836] border-[#504945]">
                                                                {durationOptions.map((duration) => (
                                                                    <SelectItem key={duration} value={duration}>
                                                                        {duration}
                                                                    </SelectItem>
                                                                ))}
                                                            </SelectContent>
                                                        </Select>
                                                        <Button
                                                            onClick={() => removeNote(sequence.id, index)}
                                                            variant="destructive"
                                                            size="sm"
                                                            className="bg-[#cc241d] hover:bg-[#fb4934] text-[#ebdbb2] rounded-full px-2"
                                                        >
                                                            ×
                                                        </Button>
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                    </CardContent>
                                </Card>
                            ))}
                        </div>
                    )}
                </div>
            </CardContent>
        </Card>
    )
} 