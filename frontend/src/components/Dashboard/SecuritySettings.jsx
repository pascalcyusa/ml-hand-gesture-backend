
import { useState } from 'react';
import { Button } from '../ui/button.jsx';
import { Input } from '../ui/input.jsx';

export default function SecuritySettings({ onUpdatePassword }) {
    const [formData, setFormData] = useState({
        currentPassword: '',
        newPassword: '',
        confirmPassword: '',
    });
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
        setError('');
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');

        if (formData.newPassword !== formData.confirmPassword) {
            setError("New passwords do not match.");
            return;
        }

        if (formData.newPassword.length < 6) {
            setError("Password must be at least 6 characters.");
            return;
        }

        setLoading(true);
        try {
            await onUpdatePassword(formData.currentPassword, formData.newPassword);
            setFormData({ currentPassword: '', newPassword: '', confirmPassword: '' });
        } catch (err) {
            setError("Failed to update password. Check your current password.");
        } finally {
            setLoading(false);
        }
    };

    return (
        <form onSubmit={handleSubmit} className="settings-form space-y-6 max-w-2xl">
            <div className="form-section">
                <h3 className="text-lg font-semibold mb-4">Password</h3>

                <div className="grid gap-6">
                    <div className="grid gap-2">
                        <label className="text-sm font-medium text-[var(--fg-muted)]">Current Password</label>
                        <Input
                            name="currentPassword"
                            type="password"
                            value={formData.currentPassword}
                            onChange={handleChange}
                            required
                        />
                    </div>

                    <div className="grid gap-2">
                        <label className="text-sm font-medium text-[var(--fg-muted)]">New Password</label>
                        <Input
                            name="newPassword"
                            type="password"
                            value={formData.newPassword}
                            onChange={handleChange}
                            required
                        />
                    </div>

                    <div className="grid gap-2">
                        <label className="text-sm font-medium text-[var(--fg-muted)]">Confirm New Password</label>
                        <Input
                            name="confirmPassword"
                            type="password"
                            value={formData.confirmPassword}
                            onChange={handleChange}
                            required
                        />
                    </div>
                </div>
            </div>

            {error && <p className="text-[var(--gold)] text-sm">{error}</p>}

            <div className="flex justify-end pt-4">
                <Button type="submit" variant="accent" className="bg-[var(--gold)] text-white hover:bg-[var(--gold-dim)] border-none" disabled={loading}>
                    {loading ? 'Updating...' : 'Update Password'}
                </Button>
            </div>
        </form>
    );
}
