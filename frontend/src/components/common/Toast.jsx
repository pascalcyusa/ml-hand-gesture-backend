import { useEffect, useState } from 'react';
import {
    CheckCircleIcon,
    ExclamationCircleIcon,
    InformationCircleIcon,
    ExclamationTriangleIcon,
    XMarkIcon
} from '@heroicons/react/24/solid'; // Solid icons look better for status
import './Toast.css';

const icons = {
    success: <CheckCircleIcon className="w-6 h-6" />,
    error: <ExclamationCircleIcon className="w-6 h-6" />,
    warning: <ExclamationTriangleIcon className="w-6 h-6" />,
    info: <InformationCircleIcon className="w-6 h-6" />,
};

export default function Toast({ message, type = 'info', onClose, duration = 3000 }) {
    const [isExiting, setIsExiting] = useState(false);

    useEffect(() => {
        const timer = setTimeout(() => {
            handleClose();
        }, duration);

        return () => clearTimeout(timer);
    }, [duration]);

    const handleClose = () => {
        setIsExiting(true);
        // Wait for animation to finish before actual unmount
        setTimeout(() => {
            onClose();
        }, 300);
    };

    return (
        <div className="toast-container">
            <div className={`toast toast-${type} ${isExiting ? 'fade-out' : ''}`}>

                {/* Status Icon */}
                <div className="toast-icon-wrapper">
                    {icons[type] || icons.info}
                </div>

                {/* Message */}
                <div className="toast-message">
                    {message}
                </div>

                {/* Close Button */}
                <button className="toast-close" onClick={handleClose}>
                    <XMarkIcon className="w-5 h-5" />
                </button>
            </div>
        </div>
    );
}