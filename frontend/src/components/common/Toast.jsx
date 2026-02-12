import { useEffect, useState } from 'react';

import {
    CheckCircleIcon,
    ExclamationCircleIcon,
    InformationCircleIcon,
    XMarkIcon,
} from '@heroicons/react/24/outline';

export default function Toast({ message, type = 'info', onClose }) {
    const [fadeOut, setFadeOut] = useState(false);

    useEffect(() => {
        const timer = setTimeout(() => {
            setFadeOut(true);
            setTimeout(onClose, 300);
        }, 2700);
        return () => clearTimeout(timer);
    }, [onClose]);

    const icons = {
        success: <CheckCircleIcon className="h-5 w-5 text-green-400" />,
        error: <ExclamationCircleIcon className="h-5 w-5 text-red-400" />,
        info: <InformationCircleIcon className="h-5 w-5 text-blue-400" />,
    };

    return (
        <div className={`toast toast-${type} ${fadeOut ? 'fade-out' : ''}`}>
            {icons[type] || icons.info}
            <span className="toast-message">{message}</span>
        </div>
    );
}
