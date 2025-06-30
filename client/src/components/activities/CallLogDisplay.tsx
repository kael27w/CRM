import { useEffect, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { format } from "date-fns";
import { fetchCallLogs, type CallLogEntry } from "@/lib/api";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { CreateContactFromCallForm } from "./CreateContactFromCallForm";
import { LinkCallToContactForm } from "./LinkCallToContactForm";

/**
 * Formats duration in seconds to a human-readable format (e.g., "1m 30s")
 */
function formatDuration(seconds: number): string {
  if (!seconds && seconds !== 0) return "N/A";
  
  const minutes = Math.floor(seconds / 60);
  const remainingSeconds = seconds % 60;
  
  if (minutes === 0) {
    return `${remainingSeconds}s`;
  }
  
  return `${minutes}m ${remainingSeconds}s`;
}

/**
 * Component that displays a table of call logs
 */
function CallLogDisplay() {
  console.log("CallLogDisplay component rendering...");
  
  // State for dialog control
  const [selectedCall, setSelectedCall] = useState<CallLogEntry | null>(null);
  const [isCreateContactDialogOpen, setIsCreateContactDialogOpen] = useState(false);
  const [isLinkContactDialogOpen, setIsLinkContactDialogOpen] = useState(false);
  
  const { 
    data: calls = [], 
    isLoading, 
    isError, 
    error,
    refetch
  } = useQuery({
    queryKey: ['callLogs'],
    queryFn: fetchCallLogs,
    retry: 2,
    staleTime: 60000,
  });

  useEffect(() => {
    console.log("CallLogDisplay - Query Data:", calls, "Loading:", isLoading, "Error:", isError);
  }, [calls, isLoading, isError]);
  
  // Handlers for contact actions
  const handleCreateContact = (call: CallLogEntry) => {
    setSelectedCall(call);
    setIsCreateContactDialogOpen(true);
  };
  
  const handleLinkContact = (call: CallLogEntry) => {
    setSelectedCall(call);
    setIsLinkContactDialogOpen(true);
  };
  
  const handleContactCreatedAndLinked = () => {
    console.log("Contact created and linked successfully");
    refetch(); // Refetch call logs to update the UI
  };
  
  const handleCallLinked = () => {
    console.log("Call linked to contact successfully");
    refetch(); // Refetch call logs to update the UI
  };
  
  if (isLoading) {
    return <p className="p-4">Loading call logs...</p>;
  }

  if (isError) {
    return (
      <div className="p-4">
        <p className="text-red-500 mb-4">
          Error fetching call logs: {error instanceof Error ? error.message : 'Unknown error'}
        </p>
        <Button onClick={() => refetch()} variant="outline">
          Retry
        </Button>
      </div>
    );
  }

  if (calls.length === 0) {
    return <p className="p-4">No call records found.</p>;
  }

  return (
    <div className="p-4">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-xl font-semibold">Call History</h2>
        <Badge variant="outline">{calls.length} Records</Badge>
      </div>
      
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Date/Time</TableHead>
            <TableHead>Caller</TableHead>
            <TableHead>Direction</TableHead>
            <TableHead>Status</TableHead>
            <TableHead>Duration</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {calls.map((call) => (
            <TableRow key={call.id || call.call_sid}>
              <TableCell>
                {format(new Date(call.created_at), 'MMM d, yyyy h:mm a')}
              </TableCell>
              <TableCell>
                {call.contact_id && call.contact_first_name ? (
                  <div>{`${call.contact_first_name} ${call.contact_last_name || ''}`}</div>
                ) : (
                  <div className="flex flex-col space-y-2">
                    <div>{call.from_number || "Unknown"}</div>
                    <div className="flex space-x-2">
                      <Button 
                        variant="outline" 
                        size="sm" 
                        onClick={() => handleCreateContact(call)}
                        className="text-xs h-7 px-2"
                      >
                        Create & Link Contact
                      </Button>
                      <Button 
                        variant="outline" 
                        size="sm" 
                        onClick={() => handleLinkContact(call)}
                        className="text-xs h-7 px-2"
                      >
                        Link to Existing
                      </Button>
                    </div>
                  </div>
                )}
              </TableCell>
              <TableCell>
                <Badge variant={call.direction === "inbound" ? "default" : "secondary"}>
                  {call.direction ? call.direction.charAt(0).toUpperCase() + call.direction.slice(1) : "N/A"}
                </Badge>
              </TableCell>
              <TableCell>
                {call.status ? (
                  <Badge variant={call.status === "completed" ? "default" : "secondary"}>
                    {call.status.charAt(0).toUpperCase() + call.status.slice(1)}
                  </Badge>
                ) : (
                  "N/A"
                )}
              </TableCell>
              <TableCell>{formatDuration(call.duration)}</TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
      
      {/* Create Contact Dialog */}
      <Dialog open={isCreateContactDialogOpen} onOpenChange={setIsCreateContactDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Create New Contact from Call</DialogTitle>
          </DialogHeader>
          {selectedCall && (
            <CreateContactFromCallForm
              call={selectedCall}
              onContactCreatedAndLinked={handleContactCreatedAndLinked}
              setOpen={setIsCreateContactDialogOpen}
            />
          )}
        </DialogContent>
      </Dialog>
      
      {/* Link Contact Dialog */}
      <Dialog open={isLinkContactDialogOpen} onOpenChange={setIsLinkContactDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Link Call to Existing Contact</DialogTitle>
          </DialogHeader>
          {selectedCall && (
            <LinkCallToContactForm
              call={selectedCall}
              onCallLinked={handleCallLinked}
              setOpen={setIsLinkContactDialogOpen}
            />
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}

// Export both as default and named export
export { CallLogDisplay };
export default CallLogDisplay; 