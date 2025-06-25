"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Brain, Piano, Zap, Github, ExternalLink } from "lucide-react"

export function AboutPanel() {
    return (
        <Card className="bg-[#3c3836] border-[#504945] rounded-3xl">
            <CardHeader>
                <CardTitle className="text-[#fabd2f] flex items-center gap-2">
                    <Brain className="w-6 h-6" />
                    About This Project
                </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6 text-[#ebdbb2]">
                <div className="space-y-4">
                    <p className="text-lg leading-relaxed">
                        The Hand Pose Piano Machine combines computer vision, machine learning, and robotics to create an
                        interactive musical experience using the SPIKE Prime Kit.
                    </p>
                    <p className="text-lg leading-relaxed">
                        Train the system to recognize your hand gestures, then use those gestures to play piano notes and
                        control motor movements in real-time.
                    </p>
                </div>

                <div className="grid md:grid-cols-3 gap-6">
                    <div className="text-center p-6 bg-[#1d2021] rounded-3xl border border-[#504945]">
                        <Brain className="w-12 h-12 mx-auto mb-4 text-[#d79921]" />
                        <h3 className="font-semibold text-[#fabd2f] text-lg mb-2">Machine Learning</h3>
                        <p className="text-sm text-[#a89984] leading-relaxed">
                            Train custom hand pose recognition models using MediaPipe and TensorFlow.js.
                            Collect samples and build accurate gesture classifiers.
                        </p>
                    </div>

                    <div className="text-center p-6 bg-[#1d2021] rounded-3xl border border-[#504945]">
                        <Piano className="w-12 h-12 mx-auto mb-4 text-[#d79921]" />
                        <h3 className="font-semibold text-[#fabd2f] text-lg mb-2">Music Creation</h3>
                        <p className="text-sm text-[#a89984] leading-relaxed">
                            Generate music through hand gestures. Configure note sequences, durations,
                            and create beautiful melodies with simple hand movements.
                        </p>
                    </div>

                    <div className="text-center p-6 bg-[#1d2021] rounded-3xl border border-[#504945]">
                        <Zap className="w-12 h-12 mx-auto mb-4 text-[#d79921]" />
                        <h3 className="font-semibold text-[#fabd2f] text-lg mb-2">Motor Control</h3>
                        <p className="text-sm text-[#a89984] leading-relaxed">
                            Control SPIKE Prime motors in real-time. Map gestures to motor actions,
                            speeds, and durations for interactive robotics projects.
                        </p>
                    </div>
                </div>

                <div className="space-y-4">
                    <h3 className="text-xl font-semibold text-[#fabd2f]">How It Works</h3>
                    <div className="space-y-3">
                        <div className="flex items-start gap-3">
                            <div className="w-6 h-6 bg-[#689d6a] text-[#282828] rounded-full flex items-center justify-center text-sm font-bold mt-0.5">
                                1
                            </div>
                            <div>
                                <h4 className="font-semibold text-[#ebdbb2]">Train Hand Poses</h4>
                                <p className="text-[#a89984] text-sm">
                                    Use your camera to collect samples of different hand gestures. Create classes for each pose you want to recognize.
                                </p>
                            </div>
                        </div>

                        <div className="flex items-start gap-3">
                            <div className="w-6 h-6 bg-[#689d6a] text-[#282828] rounded-full flex items-center justify-center text-sm font-bold mt-0.5">
                                2
                            </div>
                            <div>
                                <h4 className="font-semibold text-[#ebdbb2]">Train the Model</h4>
                                <p className="text-[#a89984] text-sm">
                                    The machine learning model learns to recognize your hand poses from the collected samples.
                                </p>
                            </div>
                        </div>

                        <div className="flex items-start gap-3">
                            <div className="w-6 h-6 bg-[#689d6a] text-[#282828] rounded-full flex items-center justify-center text-sm font-bold mt-0.5">
                                3
                            </div>
                            <div>
                                <h4 className="font-semibold text-[#ebdbb2]">Configure Actions</h4>
                                <p className="text-[#a89984] text-sm">
                                    Map each hand pose to piano notes or motor actions. Set up sequences and control parameters.
                                </p>
                            </div>
                        </div>

                        <div className="flex items-start gap-3">
                            <div className="w-6 h-6 bg-[#689d6a] text-[#282828] rounded-full flex items-center justify-center text-sm font-bold mt-0.5">
                                4
                            </div>
                            <div>
                                <h4 className="font-semibold text-[#ebdbb2]">Create Music & Motion</h4>
                                <p className="text-[#a89984] text-sm">
                                    Perform your hand gestures to trigger piano notes and motor movements in real-time!
                                </p>
                            </div>
                        </div>
                    </div>
                </div>

                <div className="space-y-4">
                    <h3 className="text-xl font-semibold text-[#fabd2f]">Technology Stack</h3>
                    <div className="grid md:grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <h4 className="font-semibold text-[#ebdbb2]">Frontend</h4>
                            <ul className="text-sm text-[#a89984] space-y-1">
                                <li>• Next.js 15 with React 19</li>
                                <li>• TypeScript for type safety</li>
                                <li>• Tailwind CSS for styling</li>
                                <li>• shadcn/ui component library</li>
                            </ul>
                        </div>
                        <div className="space-y-2">
                            <h4 className="font-semibold text-[#ebdbb2]">Machine Learning</h4>
                            <ul className="text-sm text-[#a89984] space-y-1">
                                <li>• MediaPipe for hand detection</li>
                                <li>• TensorFlow.js for model training</li>
                                <li>• Real-time gesture recognition</li>
                                <li>• Web Audio API for sound generation</li>
                            </ul>
                        </div>
                        <div className="space-y-2">
                            <h4 className="font-semibold text-[#ebdbb2]">Hardware Integration</h4>
                            <ul className="text-sm text-[#a89984] space-y-1">
                                <li>• SPIKE Prime Kit support</li>
                                <li>• Motor control via PyScript</li>
                                <li>• Real-time communication</li>
                                <li>• Configurable motor actions</li>
                            </ul>
                        </div>
                        <div className="space-y-2">
                            <h4 className="font-semibold text-[#ebdbb2]">Audio & Music</h4>
                            <ul className="text-sm text-[#a89984] space-y-1">
                                <li>• Web Audio API integration</li>
                                <li>• Piano note generation</li>
                                <li>• Configurable note sequences</li>
                                <li>• Multiple duration options</li>
                            </ul>
                        </div>
                    </div>
                </div>

                <div className="border-t border-[#504945] pt-6">
                    <div className="flex items-center justify-between">
                        <div>
                            <h3 className="font-semibold text-[#fabd2f]">Hand Pose Piano Machine</h3>
                            <p className="text-sm text-[#a89984]">Version 2.0 - Next.js Edition</p>
                        </div>
                        <div className="flex gap-2">
                            <a
                                href="https://github.com/your-username/ml-hand-gesture-backend"
                                target="_blank"
                                rel="noopener noreferrer"
                                className="p-2 bg-[#1d2021] hover:bg-[#3c3836] rounded-full transition-colors"
                                title="View on GitHub"
                            >
                                <Github className="w-5 h-5 text-[#ebdbb2]" />
                            </a>
                            <a
                                href="https://mediapipe.dev/"
                                target="_blank"
                                rel="noopener noreferrer"
                                className="p-2 bg-[#1d2021] hover:bg-[#3c3836] rounded-full transition-colors"
                                title="MediaPipe Documentation"
                            >
                                <ExternalLink className="w-5 h-5 text-[#ebdbb2]" />
                            </a>
                        </div>
                    </div>
                </div>
            </CardContent>
        </Card>
    )
} 