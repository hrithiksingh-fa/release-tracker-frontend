import { BrowserRouter, Routes, Route } from "react-router-dom";
import { TokenGate } from "./components/TokenGate.js";
import { Layout } from "./components/Layout.js";
import { ClientsPage } from "./pages/ClientsPage.js";
import { ClientDetailPage } from "./pages/ClientDetailPage.js";
import { TrackerGridPage } from "./pages/TrackerGridPage.js";
import { RequirementDetailPage } from "./pages/RequirementDetailPage.js";
import { ReviewQueuePage } from "./pages/ReviewQueuePage.js";

export function App() {
  return (
    <TokenGate>
      <BrowserRouter>
        <Routes>
          <Route element={<Layout />}>
            <Route path="/" element={<ClientsPage />} />
            <Route path="/clients/:clientId" element={<ClientDetailPage />} />
            <Route path="/trackers/:trackerId" element={<TrackerGridPage />} />
            <Route path="/requirements/:requirementId" element={<RequirementDetailPage />} />
            <Route path="/review" element={<ReviewQueuePage />} />
          </Route>
        </Routes>
      </BrowserRouter>
    </TokenGate>
  );
}
