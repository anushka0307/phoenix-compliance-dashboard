import { BrowserRouter, Navigate, Route, Routes } from "react-router-dom";
import { ActivationToast } from "@/components/ActivationToast";
import { AppLayout } from "@/components/layout/AppLayout";
import { MsaWorkspaceLayout } from "@/components/layout/MsaWorkspaceLayout";
import { CampaignNavigationProvider } from "@/contexts/CampaignNavigationContext";
import { MsaNavigationProvider } from "@/contexts/MsaNavigationContext";
import { NetworkProvider } from "@/contexts/NetworkContext";
import { HomePage } from "@/pages/HomePage";
import { MsaOverviewPage } from "@/pages/MsaOverviewPage";
import { MarketAnalysisPage } from "@/pages/MarketAnalysisPage";
import { PgAcquisitionPage } from "@/pages/PgAcquisitionPage";
import { CustomerSuccessPage } from "@/pages/CustomerSuccessPage";
import { CampaignListPage } from "@/pages/CampaignListPage";
import { CampaignDetailRoute } from "@/pages/CampaignDetailRoute";

export function App() {
  return (
    <BrowserRouter>
      <NetworkProvider>
        <MsaNavigationProvider>
          <CampaignNavigationProvider>
            <Routes>
              <Route element={<AppLayout />}>
                <Route index element={<HomePage />} />
                <Route path="msa/:msaId" element={<MsaWorkspaceLayout />}>
                  <Route index element={<MsaOverviewPage />} />
                  <Route path="market-analysis" element={<MarketAnalysisPage />} />
                  <Route path="pg-acquisition" element={<PgAcquisitionPage />} />
                  <Route path="customer-success" element={<CustomerSuccessPage />} />
                  <Route path="campaigns" element={<CampaignListPage />} />
                  <Route path="campaigns/:campaignId" element={<CampaignDetailRoute />} />
                </Route>
                <Route path="*" element={<Navigate to="/" replace />} />
              </Route>
            </Routes>
            <ActivationToast />
          </CampaignNavigationProvider>
        </MsaNavigationProvider>
      </NetworkProvider>
    </BrowserRouter>
  );
}
