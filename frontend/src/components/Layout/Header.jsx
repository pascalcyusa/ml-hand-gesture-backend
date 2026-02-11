export default function Header() {
    return (
        <header className="app-header">
            <div className="header-inner">
                <div className="header-logo">
                    <span className="header-icon">🤖</span>
                    <div>
                        <h1 className="header-title">Hand Pose Trainer</h1>
                        <p className="header-subtitle">Teachable Machine for Hand Gestures</p>
                    </div>
                </div>
                <div className="header-badge">
                    <span className="header-badge-dot" />
                    <span>ML Ready</span>
                </div>
            </div>
        </header>
    );
}
