import React, { useState, useEffect, useCallback } from "react"; // Added useCallback
import { useQuery } from "@tanstack/react-query";
import { Link } from "wouter";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { Plus, Users, User, Upload } from "lucide-react";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";

import AddContactDialog from "@/components/contacts/AddContactDialog";
import ImportCsvDialog from "@/components/contacts/ImportCsvDialog";
import { fetchContacts } from "@/lib/api";
import { useAuth } from "@/lib/context/AuthContext";

/**
 * ContactsPage component that displays a table of all contacts with data ownership support
 */
const ContactsPage: React.FC = () => {
  const [addDialogOpen, setAddDialogOpen] = useState(false);
  const [importDialogOpen, setImportDialogOpen] = useState(false);
  const { profile, isLoadingProfile, user } = useAuth();
  const currentUserId = user?.id;

  // This reflects current, confirmed admin status from a successfully loaded profile
  const isConfirmedAdmin = !isLoadingProfile && !!profile && profile.is_admin === true;
  // This reflects if user is logged in, even if profile fetch is pending/failed
  const isAuthenticatedUser = !isLoadingProfile && !!user;

  console.log(`[CONTACTS_PAGE_RENDER_START] isLoadingProfile: ${isLoadingProfile}, currentUserId: ${currentUserId}, isConfirmedAdmin: ${isConfirmedAdmin}, isAuthenticatedUser: ${isAuthenticatedUser}, profile_exists: ${!!profile}`);

  const initializeViewAllContacts = useCallback(() => {
    let initialToggleState = false;
    if (currentUserId) { // Key off currentUserId for reading localStorage
      const storageKey = `contactsViewAll_${currentUserId}`;
      try {
        const storedPreference = localStorage.getItem(storageKey);
        initialToggleState = storedPreference === 'true';
        console.log(`[DEBUG_USESTATE_INIT] User ${currentUserId}: Reading storageKey '${storageKey}'. Stored: "${storedPreference}". InitialToggleState set to: ${initialToggleState}`);
      } catch (e) {
        console.warn(`[DEBUG_USESTATE_INIT] Error reading localStorage for key ${storageKey}`, e);
        initialToggleState = false; // Default on error
      }
    } else {
      console.log("[DEBUG_USESTATE_INIT] No currentUserId at time of useState init. Defaulting toggle to false.");
    }
    return initialToggleState;
  }, [currentUserId]); // Only depends on currentUserId

  const [viewAllContacts, setViewAllContacts] = useState(initializeViewAllContacts);

  console.log(`[CONTACTS_RENDER] isLoadingProfile: ${isLoadingProfile}, isConfirmedAdmin: ${isConfirmedAdmin}, currentUserId: ${currentUserId}, viewAllContacts (state): ${viewAllContacts}, profile_exists: ${!!profile}`);

  // Effect to react to changes in authentication or confirmed admin status
  useEffect(() => {
    console.log(`[CONTACTS_EFFECT_SYNC] Running. isLoadingProfile: ${isLoadingProfile}, isConfirmedAdmin: ${isConfirmedAdmin}, currentUserId: ${currentUserId}, profile_exists: ${!!profile}`);

    if (isLoadingProfile) return; // Still waiting for auth attempt to fully resolve

    if (isAuthenticatedUser) { // User is logged in
      if (isConfirmedAdmin) { // And profile loaded AND they are admin
        const storageKey = `contactsViewAll_${currentUserId}`;
        const storedPreference = localStorage.getItem(storageKey);
        const shouldViewAll = storedPreference === 'true';
        if (viewAllContacts !== shouldViewAll) {
          console.log(`[CONTACTS_EFFECT_SYNC] Admin ${currentUserId}: State (${viewAllContacts}) differs from localStorage (${shouldViewAll}). Syncing state.`);
          setViewAllContacts(shouldViewAll);
        }
      } else if (profile === null && !isLoadingProfile) { 
        // Profile fetch failed/timed out for an authenticated user.
        // DO NOT CLEAR localStorage here. Keep existing viewAllContacts state.
        // The toggle visibility will handle whether to show it.
        console.log(`[CONTACTS_EFFECT_SYNC] User ${currentUserId}: Profile fetch failed/timed out. Retaining current viewAllContacts: ${viewAllContacts}`);
      } else if (!isConfirmedAdmin && profile !== undefined) { 
        // User is authenticated, profile loaded, but they are NOT admin
        console.log(`[CONTACTS_EFFECT_SYNC] Not Admin (${currentUserId}). Ensuring viewAllContacts is false and clearing storage.`);
        if (viewAllContacts) setViewAllContacts(false);
        localStorage.removeItem(`contactsViewAll_${currentUserId}`);
      }
    } else { // User logged out
      console.log('[CONTACTS_EFFECT_SYNC] User logged out. Resetting viewAllContacts to false.');
      if (viewAllContacts) setViewAllContacts(false);
      if (currentUserId) localStorage.removeItem(`contactsViewAll_${currentUserId}`); // Clear for last known user
    }
  }, [isLoadingProfile, isConfirmedAdmin, currentUserId, profile, viewAllContacts]);
  
  const handleToggleChange = (checked: boolean) => {
    setViewAllContacts(checked);
    if (isConfirmedAdmin && currentUserId) { // Only allow admin to save preference
      localStorage.setItem(`contactsViewAll_${currentUserId}`, checked ? 'true' : 'false');
      console.log(`[CONTACTS_TOGGLE_SAVE] Admin ${currentUserId} saved pref for contactsViewAll_${currentUserId}: ${checked}`);
    }
  };

  // viewParam now depends on isConfirmedAdmin for 'all' view
  const viewParam: 'mine' | 'all' = isConfirmedAdmin && viewAllContacts ? 'all' : 'mine';
  console.log(`[CONTACTS_VIEW_PARAM] Calculated viewParam: ${viewParam}`);

  const { data: contactsData, isLoading: isLoadingContacts, isError, error: contactsError } = useQuery({
    queryKey: ["contactsList", viewParam, isConfirmedAdmin, currentUserId],
    queryFn: () => {
      console.log(`[CONTACTS_QUERY] Fetching with viewParam: ${viewParam} for user ${currentUserId} (isConfirmedAdmin: ${isConfirmedAdmin})`);
      return fetchContacts(viewParam);
    },
    enabled: !isLoadingProfile && !!currentUserId && profile !== undefined, // Query only if profile attempt is resolved (success or fail)
  });

  // Aliases for backward compatibility with existing code
  const contacts = contactsData;
  const isLoading = isLoadingContacts;
  const error = contactsError;

  const showAdminToggle = !isLoadingProfile && !!profile && isConfirmedAdmin;
  console.log(`[CONTACTS_RENDER_TOGGLE_CHECK] showAdminToggle: ${showAdminToggle}`);

  // Show loading state if profile is still loading
  if (isLoadingProfile || profile === undefined) {
    return (
      <div className="space-y-4 p-4">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-bold">Contacts</h1>
          <div className="flex gap-2">
            <Button disabled>
              <Plus className="mr-2 h-4 w-4" /> Add Contact
            </Button>
            <Button disabled variant="outline">
              <Upload className="mr-2 h-4 w-4" /> Import CSV
            </Button>
          </div>
        </div>
        <Card>
          <CardHeader>
            <CardTitle>
              <Skeleton className="h-8 w-40" />
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <p className="text-gray-500 text-center">Loading user profile...</p>
              {[1, 2, 3].map((i) => (
                <Skeleton key={i} className="h-12 w-full" />
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }
  
  // Error state
  if (isError) {
    const errorMessage = error instanceof Error ? error.message : "Unknown error";
    const isAuthError = errorMessage.includes('Unauthorized') || errorMessage.includes('401');
    
    return (
      <div className="space-y-4 p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <h1 className="text-2xl font-bold">Contacts</h1>
            {showAdminToggle && (
              <div className="flex items-center space-x-2 px-3 py-1 rounded-lg bg-blue-50 dark:bg-blue-900/20">
                <User className="h-4 w-4 text-blue-600 dark:text-blue-400" />
                <Switch
                  id="view-toggle"
                  checked={viewAllContacts}
                  onCheckedChange={handleToggleChange}
                  disabled={true} // Disable during error
                />
                <Users className="h-4 w-4 text-blue-600 dark:text-blue-400" />
                <Label htmlFor="view-toggle" className="text-sm text-red-600 dark:text-red-400">
                  Error
                </Label>
              </div>
            )}
          </div>
          <div className="flex gap-2">
            <Button onClick={() => setAddDialogOpen(true)}>
              <Plus className="mr-2 h-4 w-4" /> Add Contact
            </Button>
            <Button onClick={() => setImportDialogOpen(true)} variant="outline">
              <Upload className="mr-2 h-4 w-4" /> Import CSV
            </Button>
          </div>
        </div>
        <Card className="border-red-200 bg-red-50 dark:bg-red-900/10">
          <CardContent className="pt-6">
            <div className="space-y-2">
              <p className="text-red-600 dark:text-red-400 font-medium">
                {isAuthError ? "Authentication Error" : "Error Fetching Contacts"}
              </p>
              <p className="text-red-600 dark:text-red-400 text-sm">
                {isAuthError 
                  ? "You don't have permission to view contacts. Please check your authentication and try again."
                  : `Error: ${errorMessage}`
                }
              </p>
              {isAuthError && (
                <Button 
                  variant="outline" 
                  size="sm" 
                  onClick={() => window.location.reload()}
                  className="mt-2"
                >
                  Refresh Page
                </Button>
              )}
            </div>
          </CardContent>
        </Card>
        
        <AddContactDialog 
          open={addDialogOpen} 
          onOpenChange={setAddDialogOpen} 
        />
        <ImportCsvDialog 
          open={importDialogOpen} 
          onOpenChange={setImportDialogOpen} 
        />
      </div>
    );
  }
  
  // Loading state for contacts (after profile is loaded)
  if (isLoading) {
    return (
      <div className="space-y-4 p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <h1 className="text-2xl font-bold">Contacts</h1>
            {showAdminToggle && (
              <div className="flex items-center space-x-2 px-3 py-1 rounded-lg bg-blue-50 dark:bg-blue-900/20">
                <User className="h-4 w-4 text-blue-600 dark:text-blue-400" />
                <Switch
                  id="view-toggle"
                  checked={viewAllContacts}
                  onCheckedChange={handleToggleChange}
                  disabled={true} // Disable during loading
                />
                <Users className="h-4 w-4 text-blue-600 dark:text-blue-400" />
                <Label htmlFor="view-toggle" className="text-sm text-blue-600 dark:text-blue-400">
                  Loading contacts...
                </Label>
              </div>
            )}
          </div>
          <div className="flex gap-2">
            <Button disabled>
              <Plus className="mr-2 h-4 w-4" /> Add Contact
            </Button>
            <Button disabled variant="outline">
              <Upload className="mr-2 h-4 w-4" /> Import CSV
            </Button>
          </div>
        </div>
        <Card>
          <CardHeader>
            <CardTitle>
              <Skeleton className="h-8 w-40" />
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {[1, 2, 3, 4, 5].map((i) => (
                <Skeleton key={i} className="h-12 w-full" />
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }
  
  // Empty state
  if (!contacts || contacts.length === 0) {
    return (
      <div className="space-y-4 p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <h1 className="text-2xl font-bold">Contacts</h1>
            {showAdminToggle && (
              <div className="flex items-center space-x-2 px-3 py-1 rounded-lg bg-blue-50 dark:bg-blue-900/20">
                <User className="h-4 w-4 text-blue-600 dark:text-blue-400" />
                <Switch
                  id="view-toggle"
                  checked={viewAllContacts}
                  onCheckedChange={handleToggleChange}
                />
                <Users className="h-4 w-4 text-blue-600 dark:text-blue-400" />
                <Label htmlFor="view-toggle" className="text-sm font-medium text-blue-800 dark:text-blue-300">
                  {viewAllContacts ? "All Contacts" : "My Contacts"}
                </Label>
              </div>
            )}
          </div>
          <div className="flex gap-2">
            <Button onClick={() => setAddDialogOpen(true)}>
              <Plus className="mr-2 h-4 w-4" /> Add Contact
            </Button>
            <Button onClick={() => setImportDialogOpen(true)} variant="outline">
              <Upload className="mr-2 h-4 w-4" /> Import CSV
            </Button>
          </div>
        </div>
        <Card>
          <CardContent className="pt-6 text-center">
            <p className="text-gray-500">
              {isConfirmedAdmin && viewAllContacts 
                ? "No contacts found in the system." 
                : "You don't have any contacts yet."}
            </p>
            <p className="text-gray-400 text-sm mt-2">
              {isConfirmedAdmin && viewAllContacts
                ? "Try switching to 'My Contacts' or create the first contact."
                : "Click 'Add Contact' to create your first contact."}
            </p>
          </CardContent>
        </Card>
        
        <AddContactDialog 
          open={addDialogOpen} 
          onOpenChange={setAddDialogOpen} 
        />
        <ImportCsvDialog 
          open={importDialogOpen} 
          onOpenChange={setImportDialogOpen} 
        />
      </div>
    );
  }
  
  return (
    <div className="space-y-4 p-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-bold">Contacts</h1>
            <Badge variant="outline">
              {contacts.length} {isConfirmedAdmin && viewAllContacts ? "Total" : "My"} Contact{contacts.length !== 1 ? "s" : ""}
            </Badge>
          </div>
          {showAdminToggle && (
            <div className="flex items-center space-x-2 px-3 py-1 rounded-lg bg-blue-50 dark:bg-blue-900/20">
              <User className="h-4 w-4 text-blue-600 dark:text-blue-400" />
              <Switch
                id="view-toggle"
                checked={viewAllContacts}
                onCheckedChange={handleToggleChange}
              />
              <Users className="h-4 w-4 text-blue-600 dark:text-blue-400" />
              <Label htmlFor="view-toggle" className="text-sm font-medium text-blue-800 dark:text-blue-300">
                {viewAllContacts ? "All Contacts" : "My Contacts"}
              </Label>
            </div>
          )}
        </div>
        <div className="flex gap-2">
          <Button onClick={() => setAddDialogOpen(true)}>
            <Plus className="mr-2 h-4 w-4" /> Add Contact
          </Button>
          <Button onClick={() => setImportDialogOpen(true)} variant="outline">
            <Upload className="mr-2 h-4 w-4" /> Import CSV
          </Button>
        </div>
      </div>
      
      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>Phone</TableHead>
                <TableHead>Email</TableHead>
                <TableHead>Company</TableHead>
                {isConfirmedAdmin && viewAllContacts && (
                  <TableHead>Owner</TableHead>
                )}
              </TableRow>
            </TableHeader>
            <TableBody>
              {contacts.map((contact) => {
                return (
                  <TableRow key={contact.id}>
                    <TableCell>
                      <Link 
                        href={`/contacts/${contact.id}`}
                        className="text-blue-600 hover:text-blue-800 hover:underline dark:text-blue-400 dark:hover:text-blue-300"
                      >
                        {contact.first_name} {contact.last_name}
                      </Link>
                    </TableCell>
                    <TableCell>{contact.phone || "—"}</TableCell>
                    <TableCell>{contact.email || "—"}</TableCell>
                    <TableCell>{contact.company || "—"}</TableCell>
                    {isConfirmedAdmin && viewAllContacts && (
                      <TableCell>
                        <span className="text-gray-600 dark:text-gray-400 text-sm">
                          {/* Once API returns owner info, display it here */}
                          Owner info
                        </span>
                      </TableCell>
                    )}
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
      
      <AddContactDialog 
        open={addDialogOpen} 
        onOpenChange={setAddDialogOpen} 
      />
      <ImportCsvDialog 
        open={importDialogOpen} 
        onOpenChange={setImportDialogOpen} 
      />
    </div>
  );
};

export default ContactsPage;