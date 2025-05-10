import React from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "../components/ui/tabs";
import CallLogDisplay from "../components/activities/CallLogDisplay";
import TestComponent from "../components/activities/TestComponent";

/**
 * Activities page component that displays different activity types in tabs
 */
export function ActivitiesPage() {
  console.log("ActivitiesPage rendering"); // Add debug log
  
  return (
    <div className="container mx-auto py-6 px-4 md:px-6">
      <h1 className="text-3xl font-bold mb-6">Activities</h1>
      
      {/* Test component to verify imports */}
      <div className="mb-6">
        <TestComponent />
      </div>
      
      <Tabs defaultValue="calls">
        <TabsList className="grid w-full grid-cols-4 mb-4">
          <TabsTrigger value="calendar">Calendar</TabsTrigger>
          <TabsTrigger value="tasks">Tasks</TabsTrigger>
          <TabsTrigger value="events">Events</TabsTrigger>
          <TabsTrigger value="calls">Calls</TabsTrigger>
        </TabsList>
        
        <TabsContent value="calendar">
          <div className="p-4 border rounded-md bg-white shadow-sm">
            <p className="p-4">Calendar feature coming soon.</p>
          </div>
        </TabsContent>
        
        <TabsContent value="tasks">
          <div className="p-4 border rounded-md bg-white shadow-sm">
            <p className="p-4">Tasks feature coming soon.</p>
          </div>
        </TabsContent>
        
        <TabsContent value="events">
          <div className="p-4 border rounded-md bg-white shadow-sm">
            <p className="p-4">Events feature coming soon.</p>
          </div>
        </TabsContent>
        
        <TabsContent value="calls">
          <div className="p-4 border rounded-md bg-white shadow-sm">
            {/* Explicitly render the CallLogDisplay component */}
            <CallLogDisplay />
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}

export default ActivitiesPage; 