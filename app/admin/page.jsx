import BridgeDashboard from "../components/BridgeDashboard.jsx";
import { BridgeSessionProvider } from "../components/BridgeSessionContext.jsx";

export default function AdminPage() {
  return (
    <BridgeSessionProvider>
      <BridgeDashboard />
    </BridgeSessionProvider>
  );
}
