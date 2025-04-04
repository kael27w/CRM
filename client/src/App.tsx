import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { ThemeProvider } from "@/lib/context/app-context";
import NotFound from "@/pages/not-found";
import MainLayout from "@/components/layouts/main-layout";
import Dashboard from "@/pages/dashboard";
import Pipelines from "@/pages/pipelines"; // Updated to pipelines (plural)
import Contacts from "@/pages/contacts"; // New contacts page
import Companies from "@/pages/companies"; // New companies page
import Products from "@/pages/products"; // New products page
import Activities from "@/pages/activities"; // New activities page (replacing calendar)
import Settings from "@/pages/settings";

// Temporary implementation for pages we need to create
const PlaceholderPage: React.FC<{title: string}> = ({title}) => (
  <div className="space-y-6">
    <h1 className="text-3xl font-bold text-slate-900 dark:text-white">{title}</h1>
    <p className="text-slate-500 dark:text-slate-400">
      This page is being implemented according to the new CRM specifications.
    </p>
  </div>
);

// Define placeholder components until we implement them
const ContactsPage = () => <PlaceholderPage title="Contacts" />;
const CompaniesPage = () => <PlaceholderPage title="Companies" />;
const ProductsPage = () => <PlaceholderPage title="Products" />;
const ActivitiesPage = () => <PlaceholderPage title="Activities" />;
const PipelinesPage = () => <PlaceholderPage title="Pipelines" />;

function Router() {
  return (
    <Switch>
      <Route path="/" component={Dashboard} />
      <Route path="/pipelines" component={PipelinesPage} />
      <Route path="/contacts" component={ContactsPage} />
      <Route path="/companies" component={CompaniesPage} />
      <Route path="/products" component={ProductsPage} />
      <Route path="/activities" component={ActivitiesPage} />
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
