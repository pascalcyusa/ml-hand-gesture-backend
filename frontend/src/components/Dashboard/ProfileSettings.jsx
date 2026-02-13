
import { useState } from 'react';
import { Button } from '../ui/button.jsx';
import { Input } from '../ui/input.jsx';

export default function ProfileSettings({ user, onUpdate }) {
    const [formData, setFormData] = useState({
        username: user?.username || '',
        email: user?.email || '',
        // display_name: user?.display_name || '', // Assuming backend supports this or consistent with username
        // bio: user?.bio || '',
        // location: user?.location || '',
    });
    const [loading, setLoading] = useState(false);

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        try {
            await onUpdate(formData);
        } catch (err) {
            // Error handled by parent or toast
        } finally {
            setLoading(false);
        }
    };

    return (
        <form onSubmit={handleSubmit} className="settings-form space-y-6 max-w-2xl">
            <div className="form-section">
                <h3 className="text-lg font-semibold mb-4">Profile Details</h3>

                <div className="grid gap-6">
                    <div className="grid gap-2">
                        <label className="text-sm font-medium text-[var(--fg-muted)]">Username</label>
                        <Input
                            name="username"
                            value={formData.username}
                            onChange={handleChange}
                            placeholder="Your username"
                        />
                    </div>

                    <div className="grid gap-2">
                        <label className="text-sm font-medium text-[var(--fg-muted)]">Email</label>
                        <Input
                            name="email"
                            type="email"
                            value={formData.email}
                            onChange={handleChange}
                            placeholder="your.email@example.com"
                        />
                    </div>

                    {/* Placeholder fields for visual match with reference, even if not fully backed yet */}
                    {/* 
                    <div className="grid gap-2">
                        <label className="text-sm font-medium text-[var(--fg-muted)]">Display Name</label>
                        <Input name="display_name" placeholder="Display Name" disabled title="Not implemented yet" />
                    </div>
                    */}
                </div>
            </div>

            <div className="flex justify-end pt-4">
                <Button type="submit" variant="accent" className="bg-[var(--gold)] text-white hover:bg-[var(--gold-dim)] border-none" disabled={loading}>
                    {loading ? 'Saving...' : 'Save Changes'}
                </Button>
            </div>
        </form>
    );
}
