import { Toast } from "react-hot-toast";
import { Button } from "@/components/ui/button";
import { useTheme } from "next-themes";

interface UndoableToastProps {
  t: Toast;
  message: React.ReactNode;
  onUndo: () => void;
}

export const UndoableToast = ({ t, message, onUndo }: UndoableToastProps) => {
  const { resolvedTheme } = useTheme();
  const isDark = resolvedTheme === "dark";

  return (
    <div
      className={`w-[400px] flex items-center p-4 gap-3 rounded-md border shadow-md ${
        isDark ? "bg-zinc-900 text-white border-zinc-800" : "bg-white text-gray-900 border-gray-200"
      }`}
    >
      <AlertTriangle className={`w-5 h-5 shrink-0 ${isDark ? "text-yellow-400" : "text-yellow-500"}`} />
      <div className="flex-1 text-sm truncate">{message}</div>
      <button
        className={`text-sm font-medium ml-2 shrink-0 hover:underline ${
          isDark ? "text-yellow-300 hover:text-yellow-200" : "text-yellow-600 hover:text-yellow-500"
        }`}
        onClick={() => {
          toast.dismiss(t.id);
          onUndo();
        }}
      >
        Undo
      </button>
    </div>
  );
};

// Helper function to create a toast with undo functionality
export const createUndoableToast = (message: React.ReactNode, onUndo: () => void) => {
  return toast.custom((t) => <UndoableToast t={t} message={message} onUndo={onUndo} />, {
    position: "top-center",
    duration: 5000,
  });
};

// Import at the top level to avoid a circular dependency issue
import { toast } from "react-hot-toast";
import { AlertTriangle, XOctagon } from "lucide-react";
