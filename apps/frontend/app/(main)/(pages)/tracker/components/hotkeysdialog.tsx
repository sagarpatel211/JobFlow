import React from "react";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Keyboard } from "lucide-react";

interface HotkeyProps {
  combo: string[];
  description: string;
}

const Hotkey = ({ combo, description }: HotkeyProps) => (
  <div className="flex items-center justify-between mb-2">
    <span className="text-sm text-muted-foreground">{description}</span>
    <div className="flex items-center gap-1">
      {combo.map((key, index) => (
        <React.Fragment key={index}>
          <kbd className="px-2 py-1 text-xs font-semibold text-gray-800 bg-gray-100 border border-gray-200 rounded-md dark:bg-gray-700 dark:text-gray-100 dark:border-gray-600">
            {key}
          </kbd>
          {index < combo.length - 1 && <span className="text-xs mx-1">+</span>}
        </React.Fragment>
      ))}
    </div>
  </div>
);

interface HotkeysDialogProps {
  trigger?: React.ReactNode;
}

export function HotkeysDialog({ trigger }: HotkeysDialogProps) {
  return (
    <Dialog>
      <DialogTrigger asChild>
        {trigger || (
          <Button variant="outline" size="sm">
            <Keyboard className="h-4 w-4 mr-2" />
            <span className="hidden sm:inline">Shortcuts</span>
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Keyboard Shortcuts</DialogTitle>
          <DialogDescription>Use these keyboard shortcuts to navigate and perform actions quickly.</DialogDescription>
        </DialogHeader>
        <div className="mt-4 space-y-4">
          <div className="border-b pb-2">
            <h3 className="text-sm font-medium mb-2">Navigation</h3>
            <Hotkey combo={["Ctrl", "←"]} description="Previous page" />
            <Hotkey combo={["Ctrl", "→"]} description="Next page" />
          </div>
          <div className="border-b pb-2">
            <h3 className="text-sm font-medium mb-2">Actions</h3>
            <Hotkey combo={["Ctrl", "Space"]} description="Add new job" />
            <Hotkey combo={["Ctrl", "Shift", "E"]} description="Edit focused job" />
            <Hotkey combo={["Ctrl", "Shift", "A"]} description="Archive focused job" />
            <Hotkey combo={["Ctrl", "Shift", "D"]} description="Delete focused job" />
            <Hotkey combo={["Ctrl", "Shift", "P"]} description="Toggle priority for focused job" />
          </div>
          <div className="border-b pb-2">
            <h3 className="text-sm font-medium mb-2">Filters</h3>
            <Hotkey combo={["Ctrl", "Shift", "1"]} description="Show only not applied jobs" />
            <Hotkey combo={["Ctrl", "Shift", "2"]} description="Show jobs posted < 1 week" />
            <Hotkey combo={["Ctrl", "Shift", "3"]} description="Show internships" />
            <Hotkey combo={["Ctrl", "Shift", "4"]} description="Show new grad positions" />
          </div>
          <div>
            <h3 className="text-sm font-medium mb-2">Interface</h3>
            <Hotkey combo={["Esc"]} description="Close dialogs or menus" />
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
