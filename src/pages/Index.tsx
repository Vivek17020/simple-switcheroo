import { useState } from "react";
import { ToggleButton } from "@/components/ui/toggle-button";

const Index = () => {
  const [isEnabled, setIsEnabled] = useState(false);
  const [notifications, setNotifications] = useState(true);
  const [darkMode, setDarkMode] = useState(false);

  return (
    <div className="flex min-h-screen items-center justify-center bg-background">
      <div className="max-w-md mx-auto p-8 space-y-8">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold mb-2">Toggle Button Demo</h1>
          <p className="text-muted-foreground">Beautiful, accessible toggle switches</p>
        </div>

        <div className="space-y-6">
          <div className="p-4 border border-border rounded-lg">
            <h3 className="font-semibold mb-4">Basic Toggle</h3>
            <ToggleButton
              checked={isEnabled}
              onChange={setIsEnabled}
              label="Enable feature"
            />
            <p className="text-sm text-muted-foreground mt-2">
              Status: {isEnabled ? "Enabled" : "Disabled"}
            </p>
          </div>

          <div className="p-4 border border-border rounded-lg">
            <h3 className="font-semibold mb-4">Different Sizes</h3>
            <div className="space-y-4">
              <ToggleButton
                size="sm"
                checked={notifications}
                onChange={setNotifications}
                label="Notifications (Small)"
              />
              <ToggleButton
                size="md"
                checked={notifications}
                onChange={setNotifications}
                label="Notifications (Medium)"
              />
              <ToggleButton
                size="lg"
                checked={notifications}
                onChange={setNotifications}
                label="Notifications (Large)"
              />
            </div>
          </div>

          <div className="p-4 border border-border rounded-lg">
            <h3 className="font-semibold mb-4">States</h3>
            <div className="space-y-4">
              <ToggleButton
                checked={darkMode}
                onChange={setDarkMode}
                label="Dark mode"
              />
              <ToggleButton
                checked={false}
                onChange={() => {}}
                label="Disabled toggle"
                disabled
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Index;
