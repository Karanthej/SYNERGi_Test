import { Outlet } from "react-router-dom";
import { GlobalCallProvider } from "@/components/chat/GlobalCallProvider";
import { CallOverlay } from "@/components/chat/CallOverlay";
import { CallWaitingOverlay } from "@/components/chat/CallWaitingOverlay";
import { useCallStore } from "@/store/useCallStore";
import { useTitleSync } from '@/hooks/useTitleSync';

/**
 * RootLayout — wraps every route inside the router.
 * Mounts GlobalCallProvider (voice call logic) and IncomingCallBanner
 * once for the entire app, inside the router context so useLocation works.
 */
export function RootLayout() {
  useTitleSync();
  const uiMode = useCallStore(s => s.uiMode);

  return (
    <GlobalCallProvider>
      {(uiMode === 'center_popup' || uiMode === 'mini_floating') && (
        <CallOverlay mode={uiMode} />
      )}
      <CallWaitingOverlay />
      <Outlet />
    </GlobalCallProvider>
  );
}
