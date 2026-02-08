import { useAuth } from "@clerk/clerk-react";
import { useEffect } from "react";
import { setTokenProvider } from "../services/httpClient";

/**
 * Initializes the httpClient token provider with Clerk's getToken.
 * Must be rendered inside ClerkProvider.
 */
export default function TokenProviderInit() {
  const { getToken } = useAuth();

  useEffect(() => {
    setTokenProvider(() => getToken());
  }, [getToken]);

  return null;
}
