import { useEffect, useState } from 'react';

export default function Toast({ message, type = 'info', onClose }) {
    const [fadeOut, setFadeOut] = useState(false);

    useEffect(() => {
        const timer = setTimeout(() => {
            setFadeOut(true);
            setTimeout(onClose, 300);
        }, 2700);
        return () => clearTimeout(timer);
    }, [onClose]);

    return (
        <div className={`toast toast-${type} ${fadeOut ? 'fade-out' : ''}`}>
            {message}
        </div>
    );
}
