import React from "react";
import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster as ShadcnToaster } from "./components/ui/toaster";
import { Toaster } from "sonner";
import { ThemeProvider } from "./lib/context/app-context";
import { AuthProvider, useAuth } from "./lib/context/AuthContext";
import { Redirect } from "wouter";
import { Loader2 } from "lucide-react";
import NotFound from "./pages/not-found";
import MainLayout from "./components/layouts/main-layout";
import Dashboard from "./pages/dashboard";
import SettingsPage from "./pages/SettingsPage";

// Authentication pages
import LoginPage from "./pages/LoginPage";
import SignUpPage from "./pages/SignUpPage";

// Import our actual implemented pages
import ContactsPage from "./pages/contacts";
import CompaniesPage from "./pages/companies";
import ProductsPage from "./pages/products";
import ActivitiesPage from "./pages/activities";
import PipelinesPage from "./pages/pipelines";
import ContactDetailPage from "./pages/ContactDetailPage";

// For pages we haven't created yet
const PlaceholderPage: React.FC<{title: string}> = ({title}) => (
  <div className="space-y-6">
    <h1 className="text-3xl font-bold text-slate-900 dark:text-white">{title}</h1>
    <p className="text-slate-500 dark:text-slate-400">
      This page is being implemented according to the new CRM specifications.
    </p>
  </div>
);

// Help page placeholder
const HelpPage = () => <PlaceholderPage title="Help & Support" />;

// Protected wrapper component
const ProtectedWrapper: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { session, isLoadingAuth } = useAuth();

  if (isLoadingAuth) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="flex flex-col items-center space-y-4">
          <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
          <p className="text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  if (!session) {
    return <Redirect to="/login" />;
  }

  return <MainLayout>{children}</MainLayout>;
};

function Router() {
  return (
    <Switch>
      {/* Public routes */}
      <Route path="/login" component={LoginPage} />
      <Route path="/signup" component={SignUpPage} />
      
      {/* Protected routes */}
      <Route path="/">
        <ProtectedWrapper>
          <Dashboard />
        </ProtectedWrapper>
      </Route>
      
      <Route path="/dashboard/:type">
        {() => (
          <ProtectedWrapper>
            <Dashboard />
          </ProtectedWrapper>
        )}
      </Route>
      
      <Route path="/pipelines">
        <ProtectedWrapper>
          <PipelinesPage />
        </ProtectedWrapper>
      </Route>
      
      <Route path="/contacts">
        <ProtectedWrapper>
          <ContactsPage />
        </ProtectedWrapper>
      </Route>
      
      <Route path="/contacts/:id">
        {(params) => (
          <ProtectedWrapper>
            <ContactDetailPage contactId={params.id} />
          </ProtectedWrapper>
        )}
      </Route>
      
      <Route path="/companies">
        <ProtectedWrapper>
          <CompaniesPage />
        </ProtectedWrapper>
      </Route>
      
      <Route path="/products">
        <ProtectedWrapper>
          <ProductsPage />
        </ProtectedWrapper>
      </Route>
      
      <Route path="/activities">
        <ProtectedWrapper>
          <ActivitiesPage />
        </ProtectedWrapper>
      </Route>
      
      <Route path="/settings">
        <ProtectedWrapper>
          <SettingsPage />
        </ProtectedWrapper>
      </Route>
      
      <Route path="/help">
        <ProtectedWrapper>
          <HelpPage />
        </ProtectedWrapper>
      </Route>
      
      <Route path="/contact-detail/:id">
        {(params) => (
          <ProtectedWrapper>
            <ContactDetailPage contactId={params.id} />
          </ProtectedWrapper>
        )}
      </Route>
      
      {/* Test route with hardcoded contact ID for testing */}
      <Route path="/test-contact-detail">
        <ProtectedWrapper>
          <ContactDetailPage contactId={1} />
        </ProtectedWrapper>
      </Route>
      
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <ThemeProvider>
        <AuthProvider>
          <Router />
          <ShadcnToaster />
          <Toaster position="top-right" richColors />
        </AuthProvider>
      </ThemeProvider>
    </QueryClientProvider>
  );
}

export default App;
