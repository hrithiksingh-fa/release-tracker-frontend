import { BrowserRouter, Routes, Route } from "react-router-dom";
import { TokenGate } from "./components/TokenGate.js";
import { Layout } from "./components/Layout.js";
import { ClientsPage } from "./pages/ClientsPage.js";
import { ClientDetailPage } from "./pages/ClientDetailPage.js";
import { PhaseDetailPage } from "./pages/PhaseDetailPage.js";
import { RequirementDetailPage } from "./pages/RequirementDetailPage.js";
import { ReviewQueuePage } from "./pages/ReviewQueuePage.js";
import { AdminPage } from "./pages/AdminPage.js";

export function App() {
  return (
    <TokenGate>
      <BrowserRouter>
        <Routes>
          <Route element={<Layout />}>
            <Route path="/" element={<ClientsPage />} />
            <Route path="/clients/:clientId" element={<ClientDetailPage />} />
            <Route path="/phases/:phaseId" element={<PhaseDetailPage />} />
            <Route path="/requirements/:requirementId" element={<RequirementDetailPage />} />
            <Route path="/review" element={<ReviewQueuePage />} />
            <Route path="/admin" element={<AdminPage />} />
          </Route>
        </Routes>
      </BrowserRouter>
    </TokenGate>
  );
}
