import React from "react";
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

// Define the type for a contact object
interface Contact {
  id: number;
  first_name: string;
  last_name: string;
  phone: string;
  email: string | null;
  company: string | null;
  created_at: string;
}

/**
 * Fetches the list of contacts from the API
 */
const fetchContacts = async (): Promise<Contact[]> => {
  const apiBaseUrl = import.meta.env.VITE_API_BASE_URL || "";
  console.log("Fetching contacts from:", `${apiBaseUrl}/api/contacts/list`);
  
  const response = await fetch(`${apiBaseUrl}/api/contacts/list`);
  
  if (!response.ok) {
    throw new Error(`Error fetching contacts: ${response.status} ${response.statusText}`);
  }
  
  return response.json();
};

/**
 * ContactsPage component that displays a table of all contacts
 */
const ContactsPage: React.FC = () => {
  const {
    data: contacts,
    isLoading,
    isError,
    error
  } = useQuery({
    queryKey: ["contactsList"],
    queryFn: fetchContacts,
    staleTime: 60000, // 1 minute
  });

  console.log("ContactsPage - Contacts data:", contacts);
  
  // Loading state
  if (isLoading) {
    return (
      <div className="space-y-4 p-4">
        <h1 className="text-2xl font-bold">Contacts</h1>
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
  
  // Error state
  if (isError) {
    return (
      <div className="space-y-4 p-4">
        <h1 className="text-2xl font-bold">Contacts</h1>
        <Card className="border-red-200 bg-red-50 dark:bg-red-900/10">
          <CardContent className="pt-6">
            <p className="text-red-600 dark:text-red-400">
              Error fetching contacts: {error instanceof Error ? error.message : "Unknown error"}
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }
  
  // Empty state
  if (!contacts || contacts.length === 0) {
    return (
      <div className="space-y-4 p-4">
        <h1 className="text-2xl font-bold">Contacts</h1>
        <Card>
          <CardContent className="pt-6 text-center">
            <p className="text-gray-500">No contacts found.</p>
          </CardContent>
        </Card>
      </div>
    );
  }
  
  return (
    <div className="space-y-4 p-4">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Contacts</h1>
        <Badge variant="outline">{contacts.length} Contacts</Badge>
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
              </TableRow>
            </TableHeader>
            <TableBody>
              {contacts.map((contact) => (
                <TableRow key={contact.id}>
                  <TableCell>
                    <Link 
                      href={`/contact-detail/${contact.id}`}
                      className="text-blue-600 hover:text-blue-800 hover:underline dark:text-blue-400 dark:hover:text-blue-300"
                    >
                      {contact.first_name} {contact.last_name}
                    </Link>
                  </TableCell>
                  <TableCell>{contact.phone || "—"}</TableCell>
                  <TableCell>{contact.email || "—"}</TableCell>
                  <TableCell>{contact.company || "—"}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
};

export default ContactsPage;