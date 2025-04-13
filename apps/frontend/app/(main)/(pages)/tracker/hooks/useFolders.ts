import { useState, useEffect, useCallback } from "react";
import { Folder } from "@/types/job";
import { getFolders } from "../services/api";
import { toast } from "react-hot-toast";

export function useFolders() {
  const [folders, setFolders] = useState<Folder[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  const loadFolders = useCallback(async () => {
    setLoading(true);
    try {
      const folderData = await getFolders();
      setFolders(folderData);
      setError(null);
    } catch (err) {
      console.error("Error loading folders:", err);
      setError("Failed to load folders");
      toast.error("Failed to load folders");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadFolders();
  }, [loadFolders]);

  const refreshFolders = useCallback(() => {
    void loadFolders();
  }, [loadFolders]);

  return {
    folders,
    loading,
    error,
    refreshFolders,
  };
}
