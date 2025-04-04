import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { ThemeProvider } from "@/lib/context/app-context";
import NotFound from "@/pages/not-found";
import MainLayout from "@/components/layouts/main-layout";
import Dashboard from "@/pages/dashboard";
import Pipeline from "@/pages/pipeline";
import Clients from "@/pages/clients";
import Policies from "@/pages/policies";
import Calendar from "@/pages/calendar-new"; // Using our new calendar component
import Underwriting from "@/pages/underwriting";
import Analytics from "@/pages/analytics";
import Communications from "@/pages/communications";
import Documents from "@/pages/documents";
import Settings from "@/pages/settings";

function Router() {
  return (
    <Switch>
      <Route path="/" component={Dashboard} />
      <Route path="/pipeline" component={Pipeline} />
      <Route path="/clients" component={Clients} />
      <Route path="/policies" component={Policies} />
      <Route path="/calendar" component={Calendar} />
      <Route path="/underwriting" component={Underwriting} />
      <Route path="/analytics" component={Analytics} />
      <Route path="/communications" component={Communications} />
      <Route path="/documents" component={Documents} />
      <Route path="/settings" component={Settings} />
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <ThemeProvider>
        <MainLayout>
          <Router />
        </MainLayout>
        <Toaster />
      </ThemeProvider>
    </QueryClientProvider>
  );
}

export default App;
