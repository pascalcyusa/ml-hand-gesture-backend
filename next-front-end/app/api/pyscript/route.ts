import { NextRequest, NextResponse } from 'next/server'

export async function POST(request: NextRequest) {
    try {
        const body = await request.json()
        const { action, data } = body

        switch (action) {
            case 'playNote':
                // This would call the Python function
                // For now, we'll simulate the response
                return NextResponse.json({
                    success: true,
                    message: `Playing note: ${data.note} for ${data.duration}`
                })

            case 'stopAll':
                // Stop all audio
                return NextResponse.json({
                    success: true,
                    message: 'Stopped all audio'
                })

            case 'stopAllMotors':
                // Stop all motors
                return NextResponse.json({
                    success: true,
                    message: 'Stopped all motors'
                })

            default:
                return NextResponse.json(
                    { success: false, error: 'Unknown action' },
                    { status: 400 }
                )
        }
    } catch (error) {
        console.error('API Error:', error)
        return NextResponse.json(
            { success: false, error: 'Internal server error' },
            { status: 500 }
        )
    }
}

export async function GET() {
    return NextResponse.json({
        status: 'ok',
        message: 'PyScript API is running'
    })
} 