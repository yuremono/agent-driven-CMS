import BridgeDashboard from "../components/BridgeDashboard";
import { BridgeSessionProvider } from "../components/BridgeSessionContext";

export default function AdminPage() {
  return (
    <BridgeSessionProvider>
      <BridgeDashboard />
    </BridgeSessionProvider>
  );
}
