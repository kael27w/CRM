import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { ThemeProvider } from "@/lib/context/app-context";
import NotFound from "@/pages/not-found";
import MainLayout from "@/components/layouts/main-layout";
import Dashboard from "@/pages/dashboard";
import Settings from "@/pages/settings";

// Import our actual implemented pages
import ContactsPage from "./pages/contacts";
import CompaniesPage from "./pages/companies";
import ProductsPage from "./pages/products";
import ActivitiesPage from "./pages/activities";
import PipelinesPage from "./pages/pipelines";

// For pages we haven't created yet
const PlaceholderPage: React.FC<{title: string}> = ({title}) => (
  <div className="space-y-6">
    <h1 className="text-3xl font-bold text-slate-900 dark:text-white">{title}</h1>
    <p className="text-slate-500 dark:text-slate-400">
      This page is being implemented according to the new CRM specifications.
    </p>
  </div>
);

// Reports page placeholder
const ReportsPage = () => <PlaceholderPage title="Reports" />;
const HelpPage = () => <PlaceholderPage title="Help & Support" />;

function Router() {
  return (
    <Switch>
      <Route path="/" component={Dashboard} />
      <Route path="/pipelines" component={PipelinesPage} />
      <Route path="/contacts" component={ContactsPage} />
      <Route path="/companies" component={CompaniesPage} />
      <Route path="/products" component={ProductsPage} />
      <Route path="/activities" component={ActivitiesPage} />
      <Route path="/analytics" component={Dashboard} /> {/* Using Dashboard temporarily */}
      <Route path="/reports" component={ReportsPage} />
      <Route path="/settings" component={Settings} />
      <Route path="/help" component={HelpPage} />
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
