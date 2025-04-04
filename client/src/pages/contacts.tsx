import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { ColumnDef } from '@tanstack/react-table';
import { DataTable } from '@/components/shared/data-table';
import { Badge } from '@/components/ui/badge';
import { apiRequest } from '@/lib/queryClient';

// This will be replaced with the actual Contact type from schema.ts
// when we update the backend
interface Contact {
  id: number;
  name: string;
  email: string;
  phone: string;
  company: string;
  title: string;
  status: string;
  owner: string;
}

const ContactsPage: React.FC = () => {
  // Sample data - this will be replaced with actual API data
  const sampleContacts: Contact[] = [
    {
      id: 1,
      name: "Sarah Johnson",
      email: "sarah.j@example.com",
      phone: "(555) 123-4567",
      company: "Acme Corp",
      title: "VP of Sales",
      status: "active",
      owner: "Alex Davis"
    },
    {
      id: 2,
      name: "Robert Thompson",
      email: "r.thompson@example.com",
      phone: "(555) 987-6543",
      company: "TechStart Inc",
      title: "CEO",
      status: "active",
      owner: "Sarah Johnson"
    },
    {
      id: 3,
      name: "Jennifer Williams",
      email: "j.williams@example.com",
      phone: "(555) 567-8901",
      company: "Global Innovations",
      title: "Marketing Director",
      status: "inactive",
      owner: "Michael Rodriguez"
    },
    {
      id: 4,
      name: "Michael Brown",
      email: "m.brown@example.com",
      phone: "(555) 234-5678",
      company: "Brown Enterprises",
      title: "Owner",
      status: "active",
      owner: "Emily Chen"
    },
    {
      id: 5,
      name: "Lisa Davis",
      email: "lisa.d@example.com",
      phone: "(555) 345-6789",
      company: "Medical Solutions",
      title: "Physician",
      status: "active",
      owner: "Alex Davis"
    }
  ];

  // Define columns for the data table
  const columns: ColumnDef<Contact>[] = [
    {
      accessorKey: "name",
      header: "Contact Name",
      cell: ({ row }) => (
        <div className="font-medium">{row.getValue("name")}</div>
      ),
    },
    {
      accessorKey: "company",
      header: "Company Name",
    },
    {
      accessorKey: "email",
      header: "Email",
    },
    {
      accessorKey: "phone",
      header: "Phone",
    },
    {
      accessorKey: "status",
      header: "Status",
      cell: ({ row }) => {
        const status = row.getValue("status") as string;
        return (
          <Badge
            variant={status === "active" ? "default" : "secondary"}
          >
            {status}
          </Badge>
        );
      },
    },
    {
      accessorKey: "owner",
      header: "Contact Owner",
    },
  ];

  // For now we'll use the sample data. Later this will be replaced with actual API data
  // const { data: contacts = [], isLoading, error } = useQuery({
  //   queryKey: ['/api/contacts'],
  //   queryFn: () => apiRequest('/api/contacts'),
  // });

  const handleRowClick = (row: any) => {
    console.log('Contact clicked:', row.original);
    // This will be expanded to show contact details or edit contact
  };

  const handleAddField = () => {
    console.log('Add field clicked');
    // This will be expanded to allow adding custom fields
  };

  return (
    <DataTable
      columns={columns}
      data={sampleContacts}
      title="Contacts"
      description="Manage your contact records"
      searchPlaceholder="Search contacts..."
      onRowClick={handleRowClick}
      onAddField={handleAddField}
    />
  );
};

export default ContactsPage;