import { useEffect, useState } from "react";

interface AuthState {
  authToken: string | null;
  loading: boolean;
}

const useAuth = (): AuthState => {
  const [authToken, setAuthToken] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    chrome.storage.sync.get(["authToken"], (result) => {
      setAuthToken(result.authToken || null);
      setLoading(false);
    });
  }, []);

  return { authToken, loading };
};

export default useAuth;
