import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Route, Routes } from "react-router-dom";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import NoticeDetail from "./pages/NoticeDetail";
import Index from "./pages/Index.tsx";
import RegisterAgent from "./pages/RegisterAgent.tsx";
import RiskAssessment from "./pages/RiskAssessment.tsx";
import DocumentVault from "./pages/DocumentVault.tsx";
import ComplianceChatbot from "./pages/ComplianceChatbot.tsx";
import ComplianceAssistant from "./pages/ComplianceAssistant.tsx";
import AdminModule from "./pages/AdminModule.tsx";
import ResponseTracker from "./pages/ResponseTracker.tsx";
import TaskManager from "./pages/TaskManager.tsx";
import ComplianceTimeline from "./pages/ComplianceTimeline.tsx";
import KPIs from "./pages/KPIs.tsx";
import AgentOutputDetail from "./pages/AgentOutputDetail.tsx";
import ComplianceCalendar from "./pages/ComplianceCalendar.tsx";
import RiskActionPlan from "./pages/RiskActionPlan.tsx";
import RegisterManager from "./pages/RegisterManager.tsx";


import ComplianceItemDetail from "./pages/ComplianceItemDetail.tsx";
import NotFound from "./pages/NotFound.tsx";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<Index />} />
          <Route path="/register-agent" element={<RegisterAgent />} />
          <Route path="/risk-assessment" element={<RiskAssessment />} />
          <Route path="/doc-vault" element={<DocumentVault />} />
          <Route path="/chatbot" element={<ComplianceChatbot />} />
          <Route path="/assistant" element={<ComplianceAssistant />} />
          <Route path="/notices/:noticeId" element={<NoticeDetail />} />
          <Route path="/response-tracker" element={<ResponseTracker />} />
          <Route path="/tasks" element={<TaskManager />} />
          <Route path="/timeline" element={<ComplianceTimeline />} />
          <Route path="/kpis" element={<KPIs />} />
          <Route path="/agent-outputs/:kind" element={<AgentOutputDetail />} />
          <Route path="/calendar" element={<ComplianceCalendar />} />
          <Route path="/risk-action-plan" element={<RiskActionPlan />} />
          <Route path="/register-manager" element={<RegisterManager />} />

          <Route path="/compliance/:id" element={<ComplianceItemDetail />} />
          <Route path="/admin" element={<AdminModule />} />
          <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
