import React from "react";
import { useQuery } from "@tanstack/react-query";
import { format } from "date-fns";
import { fetchCallLogs, type CallLogEntry } from "../../lib/api";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "../../components/ui/table";
import { Badge } from "../../components/ui/badge";

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
  console.log("CallLogDisplay rendering"); // Add debug log
  
  const { 
    data: calls = [], 
    isLoading, 
    isError, 
    error 
  } = useQuery({
    queryKey: ['callLogs'],
    queryFn: fetchCallLogs,
  });

  console.log("Query state:", { isLoading, isError, calls }); // Add debug log
  
  if (isLoading) {
    return <p className="p-4">Loading call logs...</p>;
  }

  if (isError) {
    return (
      <p className="p-4 text-red-500">
        Error fetching call logs: {error instanceof Error ? error.message : 'Unknown error'}
      </p>
    );
  }

  if (calls.length === 0) {
    return <p className="p-4">No call records found.</p>;
  }

  return (
    <div className="p-4">
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
            <TableRow key={call.id}>
              <TableCell>
                {format(new Date(call.created_at), 'MMM d, yyyy h:mm a')}
              </TableCell>
              <TableCell>
                {call.contact_first_name && call.contact_last_name ? (
                  <>
                    <div>{`${call.contact_first_name} ${call.contact_last_name}`}</div>
                    <div className="text-xs text-gray-500">{call.from_number}</div>
                  </>
                ) : (
                  call.from_number || "Unknown"
                )}
              </TableCell>
              <TableCell>
                {call.direction ? call.direction.charAt(0).toUpperCase() + call.direction.slice(1) : "N/A"}
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
    </div>
  );
}

// Export both as default and named export
export { CallLogDisplay };
export default CallLogDisplay; 