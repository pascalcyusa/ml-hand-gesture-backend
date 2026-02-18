import React from 'react';
import { Card } from '../ui/card.jsx';
import { Button } from '../ui/button.jsx';
import ModalPortal from './ModalPortal.jsx';

export default function ConfirmDialog({ isOpen, title, message, onConfirm, onCancel, confirmText = "Confirm", cancelText = "Cancel", isDangerous = false }) {
    if (!isOpen) return null;

    return (
        <ModalPortal>
            <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/50 backdrop-blur-sm p-4 animate-fade-in">
                <Card className="w-full max-w-sm p-5 space-y-4 shadow-2xl border-[var(--bg3)]">
                    <h3 className="font-bold text-lg">{title}</h3>
                    <p className="text-[var(--fg-muted)]">{message}</p>
                    <div className="flex justify-end gap-2 mt-4">
                        <Button variant="ghost" onClick={onCancel}>
                            {cancelText}
                        </Button>
                        <Button
                            variant={isDangerous ? "danger" : "primary"}
                            onClick={onConfirm}
                        >
                            {confirmText}
                        </Button>
                    </div>
                </Card>
            </div>
        </ModalPortal>
    );
}
