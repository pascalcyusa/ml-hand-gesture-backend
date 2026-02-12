export default function Header({ user, onSignIn, onLogout }) {
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
                <div className="header-user">
                    {user ? (
                        <>
                            <span className="header-avatar">👤</span>
                            <span className="header-username">{user.username}</span>
                            <button className="btn btn-sm header-logout" onClick={onLogout}>
                                Logout
                            </button>
                        </>
                    ) : (
                        <button className="btn btn-primary btn-sm" onClick={onSignIn}>
                            Sign In
                        </button>
                    )}
                </div>
            </div>
        </header>
    );
}
