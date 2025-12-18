'use client';
import { DealTabs, type DealTab } from './view-deal-component';

interface DealActivitiesNavProps {
    activeTab: DealTab,
    onTabSelect: (tab: DealTab) => void
}

export const DealActvitiesNav = ({activeTab, onTabSelect}: DealActivitiesNavProps) => {

    return (
        <div className="mt-6 border-b border-border">
            <nav className="flex gap-6">
              {DealTabs.map((tab) => (
                <button
                  key={tab}
                  onClick={() => onTabSelect(tab)}
                  className={`pb-3 text-sm font-medium capitalize transition-colors relative ${
                    activeTab === tab
                      ? "text-foreground"
                      : "text-muted-foreground hover:text-foreground"
                  }`}
                >
                  {tab}
                  {activeTab === tab && (
                    <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-primary" />
                  )}
                </button>
              ))}
            </nav>
          </div>
    )
}