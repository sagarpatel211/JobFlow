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
            Keyboard Shortcuts
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
            <Hotkey combo={["Ctrl", "Space"]} description="Create new application" />
          </div>
          <div>
            <h3 className="text-sm font-medium mb-2">Interface</h3>
            <Hotkey combo={["?"]} description="Show/hide keyboard shortcuts" />
            <Hotkey combo={["Esc"]} description="Close dialogs or menus" />
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
