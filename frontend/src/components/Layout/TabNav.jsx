import { cn } from '../../lib/utils';

export default function TabNav({ tabs, activeTab, onTabChange }) {
    return (
        <nav className="tab-nav">
            <div className="tab-nav-inner">
                {tabs.map((tab) => (
                    <button
                        key={tab.id}
                        className={cn(
                            'tab-btn',
                            activeTab === tab.id && 'active',
                            tab.disabled && 'disabled'
                        )}
                        onClick={() => !tab.disabled && onTabChange(tab.id)}
                        disabled={tab.disabled}
                    >
                        {tab.icon && <tab.icon className="h-4 w-4" />}
                        <span className="tab-label">{tab.label}</span>
                        {tab.disabled && <span className="tab-badge-soon">Soon</span>}
                    </button>
                ))}
            </div>
        </nav>
    );
}
