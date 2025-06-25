"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Switch } from "@/components/ui/switch"
import { Label } from "@/components/ui/label"
import { Settings, Play, Square, Plus } from "lucide-react"
import { toast } from "sonner"
import { usePyScript } from "@/hooks/use-pyscript"

interface MotorPanelProps {
    isConnected: boolean
    classes: string[]
}

interface MotorAction {
    id: string
    className: string
    motor: string
    action: string
    speed: number
    duration: number
    isEnabled: boolean
}

const motorOptions = ["Motor A", "Motor B", "Motor C", "Motor D"]
const actionOptions = ["Forward", "Backward", "Stop", "Rotate Left", "Rotate Right"]

export function MotorPanel({ isConnected, classes }: MotorPanelProps) {
    const [motorActions, setMotorActions] = useState<MotorAction[]>([])
    const [isMotorEnabled, setIsMotorEnabled] = useState(false)
    const [isExecuting, setIsExecuting] = useState(false)
    const { stopAllMotors, isLoading: isPyScriptLoading } = usePyScript()

    const addMotorAction = () => {
        if (classes.length === 0) {
            toast.error("No classes available", {
                description: "Please create and train some hand pose classes first",
            })
            return
        }

        const newAction: MotorAction = {
            id: Date.now().toString(),
            className: classes[0],
            motor: "Motor A",
            action: "Forward",
            speed: 50,
            duration: 1000,
            isEnabled: true
        }

        setMotorActions([...motorActions, newAction])
        toast.success("New motor action added", {
            description: "Configure the motor and action for this gesture",
        })
    }

    const updateMotorAction = (id: string, updates: Partial<MotorAction>) => {
        setMotorActions(prev => prev.map(action =>
            action.id === id ? { ...action, ...updates } : action
        ))
    }

    const deleteMotorAction = (id: string) => {
        setMotorActions(prev => prev.filter(action => action.id !== id))
        toast.info("Motor action deleted")
    }

    const testMotorAction = async (action: MotorAction) => {
        if (!action.isEnabled) {
            toast.error("Action is disabled", {
                description: "Enable the action to test it",
            })
            return
        }

        if (!isConnected) {
            toast.error("Device not connected", {
                description: "Please connect to SPIKE Prime first",
            })
            return
        }

        setIsExecuting(true)
        toast.loading("Executing motor action...", {
            description: `${action.motor}: ${action.action}`,
        })

        try {
            // Simulate motor execution
            await new Promise(resolve => setTimeout(resolve, action.duration))
            toast.success("Motor action executed successfully!")
        } catch (error) {
            toast.error("Failed to execute motor action", {
                description: error instanceof Error ? error.message : "Unknown error",
            })
        } finally {
            setIsExecuting(false)
        }
    }

    const testAllMotorActions = async () => {
        const enabledActions = motorActions.filter(action => action.isEnabled)
        if (enabledActions.length === 0) {
            toast.error("No enabled motor actions", {
                description: "Enable at least one motor action to test",
            })
            return
        }

        if (!isConnected) {
            toast.error("Device not connected", {
                description: "Please connect to SPIKE Prime first",
            })
            return
        }

        setIsExecuting(true)
        toast.loading("Executing all motor actions...", {
            description: `Executing ${enabledActions.length} actions`,
        })

        try {
            for (const action of enabledActions) {
                await testMotorAction(action)
                await new Promise(resolve => setTimeout(resolve, 500)) // Pause between actions
            }
            toast.success("All motor actions executed!")
        } catch (error) {
            toast.error("Failed to execute all motor actions", {
                description: error instanceof Error ? error.message : "Unknown error",
            })
        } finally {
            setIsExecuting(false)
        }
    }

    const stopAllMotorsAction = async () => {
        try {
            const result = await stopAllMotors()
            if (result.success) {
                toast.success("All motors stopped")
            } else {
                throw new Error(result.error || 'Failed to stop motors')
            }
        } catch (error) {
            toast.error("Failed to stop motors", {
                description: error instanceof Error ? error.message : "Unknown error",
            })
        }
        setIsExecuting(false)
    }

    return (
        <Card className="bg-[#3c3836] border-[#504945] rounded-3xl">
            <CardHeader>
                <CardTitle className="text-[#fabd2f] flex items-center gap-2">
                    <Settings className="w-6 h-6" />
                    Motor Control
                </CardTitle>
                <CardDescription className="text-[#a89984]">
                    Control SPIKE Prime motors using your trained hand gestures.
                </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
                {/* Connection Status */}
                <div className="grid md:grid-cols-2 gap-6">
                    <div className="space-y-4">
                        <h3 className="text-lg font-semibold text-[#fabd2f]">Motor Configuration</h3>
                        <div className="space-y-3">
                            {motorOptions.map((motor, index) => (
                                <div
                                    key={index}
                                    className="flex items-center justify-between p-3 bg-[#1d2021] rounded-full border border-[#504945]"
                                >
                                    <span className="text-[#ebdbb2]">{motor}</span>
                                    <Badge
                                        variant="secondary"
                                        className={`rounded-full ${isConnected ? "bg-[#689d6a] text-[#282828]" : "bg-[#cc241d] text-[#ebdbb2]"}`}
                                    >
                                        {isConnected ? "Connected" : "Disconnected"}
                                    </Badge>
                                </div>
                            ))}
                        </div>
                    </div>
                    <div className="space-y-4">
                        <h3 className="text-lg font-semibold text-[#fabd2f]">Controls</h3>
                        <div className="space-y-3">
                            <div className="flex items-center space-x-2">
                                <Switch
                                    id="motor-enabled"
                                    checked={isMotorEnabled}
                                    onCheckedChange={setIsMotorEnabled}
                                />
                                <Label htmlFor="motor-enabled" className="text-[#ebdbb2]">
                                    Enable Motor Control
                                </Label>
                            </div>
                            {isPyScriptLoading && (
                                <Badge variant="secondary" className="bg-[#d79921] text-[#282828]">
                                    Loading PyScript...
                                </Badge>
                            )}
                            <div className="flex gap-2">
                                <Button
                                    onClick={testAllMotorActions}
                                    disabled={!isMotorEnabled || isExecuting || motorActions.length === 0 || isPyScriptLoading}
                                    className="flex-1 bg-[#689d6a] hover:bg-[#8ec07c] text-[#282828] rounded-full"
                                >
                                    <Play className="w-4 h-4 mr-2" />
                                    Test All
                                </Button>
                                <Button
                                    onClick={stopAllMotorsAction}
                                    disabled={!isExecuting || isPyScriptLoading}
                                    variant="destructive"
                                    className="bg-[#cc241d] hover:bg-[#fb4934] text-[#ebdbb2] rounded-full"
                                >
                                    <Square className="w-4 h-4 mr-2" />
                                    Stop All
                                </Button>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Motor Actions */}
                <div className="space-y-4">
                    <div className="flex items-center justify-between">
                        <h3 className="text-lg font-semibold text-[#fabd2f]">Gesture Mapping</h3>
                        <Button
                            onClick={addMotorAction}
                            disabled={classes.length === 0}
                            className="bg-[#458588] hover:bg-[#83a598] text-[#282828] rounded-full"
                        >
                            <Plus className="w-4 h-4 mr-2" />
                            Add Action
                        </Button>
                    </div>

                    {motorActions.length === 0 ? (
                        <div className="text-center py-12 text-[#a89984]">
                            <Settings className="w-16 h-16 mx-auto mb-4 opacity-50" />
                            <p className="text-lg">No motor actions configured yet</p>
                            <p className="text-sm mt-2">Create actions to map hand gestures to motor movements</p>
                        </div>
                    ) : (
                        <div className="space-y-4">
                            {motorActions.map((action) => (
                                <Card key={action.id} className="bg-[#1d2021] border-[#504945]">
                                    <CardContent className="p-4">
                                        <div className="flex items-center justify-between mb-4">
                                            <div className="flex items-center gap-4">
                                                <Select
                                                    value={action.className}
                                                    onValueChange={(value) => updateMotorAction(action.id, { className: value })}
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
                                                        checked={action.isEnabled}
                                                        onCheckedChange={(checked) => updateMotorAction(action.id, { isEnabled: checked })}
                                                    />
                                                    <Label className="text-[#ebdbb2] text-sm">Enabled</Label>
                                                </div>
                                            </div>
                                            <div className="flex gap-2">
                                                <Button
                                                    onClick={() => testMotorAction(action)}
                                                    disabled={!action.isEnabled || isExecuting || !isConnected || isPyScriptLoading}
                                                    size="sm"
                                                    className="bg-[#689d6a] hover:bg-[#8ec07c] text-[#282828] rounded-full"
                                                >
                                                    <Play className="w-3 h-3 mr-1" />
                                                    Test
                                                </Button>
                                                <Button
                                                    onClick={() => deleteMotorAction(action.id)}
                                                    variant="destructive"
                                                    size="sm"
                                                    className="bg-[#cc241d] hover:bg-[#fb4934] text-[#ebdbb2] rounded-full"
                                                >
                                                    Delete
                                                </Button>
                                            </div>
                                        </div>

                                        {/* Motor Configuration */}
                                        <div className="grid grid-cols-2 gap-4">
                                            <div className="space-y-2">
                                                <Label className="text-[#ebdbb2] text-sm">Motor:</Label>
                                                <Select
                                                    value={action.motor}
                                                    onValueChange={(value) => updateMotorAction(action.id, { motor: value })}
                                                >
                                                    <SelectTrigger className="bg-[#3c3836] border-[#504945] text-[#ebdbb2]">
                                                        <SelectValue />
                                                    </SelectTrigger>
                                                    <SelectContent className="bg-[#3c3836] border-[#504945]">
                                                        {motorOptions.map((motor) => (
                                                            <SelectItem key={motor} value={motor}>
                                                                {motor}
                                                            </SelectItem>
                                                        ))}
                                                    </SelectContent>
                                                </Select>
                                            </div>
                                            <div className="space-y-2">
                                                <Label className="text-[#ebdbb2] text-sm">Action:</Label>
                                                <Select
                                                    value={action.action}
                                                    onValueChange={(value) => updateMotorAction(action.id, { action: value })}
                                                >
                                                    <SelectTrigger className="bg-[#3c3836] border-[#504945] text-[#ebdbb2]">
                                                        <SelectValue />
                                                    </SelectTrigger>
                                                    <SelectContent className="bg-[#3c3836] border-[#504945]">
                                                        {actionOptions.map((actionOption) => (
                                                            <SelectItem key={actionOption} value={actionOption}>
                                                                {actionOption}
                                                            </SelectItem>
                                                        ))}
                                                    </SelectContent>
                                                </Select>
                                            </div>
                                            <div className="space-y-2">
                                                <Label className="text-[#ebdbb2] text-sm">Speed: {action.speed}%</Label>
                                                <input
                                                    type="range"
                                                    min="0"
                                                    max="100"
                                                    value={action.speed}
                                                    onChange={(e) => updateMotorAction(action.id, { speed: parseInt(e.target.value) })}
                                                    className="w-full h-2 bg-[#3c3836] rounded-lg appearance-none cursor-pointer"
                                                />
                                            </div>
                                            <div className="space-y-2">
                                                <Label className="text-[#ebdbb2] text-sm">Duration: {action.duration}ms</Label>
                                                <input
                                                    type="range"
                                                    min="100"
                                                    max="5000"
                                                    step="100"
                                                    value={action.duration}
                                                    onChange={(e) => updateMotorAction(action.id, { duration: parseInt(e.target.value) })}
                                                    className="w-full h-2 bg-[#3c3836] rounded-lg appearance-none cursor-pointer"
                                                />
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