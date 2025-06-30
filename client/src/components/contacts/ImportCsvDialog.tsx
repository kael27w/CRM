import React, { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { 
  Dialog, 
  DialogContent, 
  DialogDescription, 
  DialogHeader, 
  DialogTitle
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Upload, FileText, AlertCircle, CheckCircle } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { importContactsCsv, type CsvImportResponse } from "@/lib/api";

interface ImportCsvDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

/**
 * Dialog component for importing contacts from CSV files
 * Supports file upload, validation, and displays import results
 */
const ImportCsvDialog: React.FC<ImportCsvDialogProps> = ({ open, onOpenChange }) => {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [importResults, setImportResults] = useState<CsvImportResponse | null>(null);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const importMutation = useMutation({
    mutationFn: importContactsCsv,
    onSuccess: (data) => {
      console.log('CSV import successful:', data);
      setImportResults(data);
      
      // Invalidate contacts query to refresh the list
      queryClient.invalidateQueries({ queryKey: ["contactsList"] });
      
      // Show success toast
      toast({
        title: "Import Completed",
        description: data.message,
        variant: "default",
      });
    },
    onError: (error: Error) => {
      console.error('CSV import failed:', error);
      toast({
        title: "Import Failed", 
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      // Validate file type
      if (!file.name.endsWith('.csv') && file.type !== 'text/csv') {
        toast({
          title: "Invalid File Type",
          description: "Please select a CSV file (.csv)",
          variant: "destructive",
        });
        return;
      }
      
      // Validate file size (5MB limit)
      if (file.size > 5 * 1024 * 1024) {
        toast({
          title: "File Too Large",
          description: "File size must be less than 5MB",
          variant: "destructive",
        });
        return;
      }
      
      setSelectedFile(file);
      setImportResults(null); // Clear previous results
    }
  };

  const handleImport = () => {
    if (!selectedFile) {
      toast({
        title: "No File Selected",
        description: "Please select a CSV file to import",
        variant: "destructive",
      });
      return;
    }

    importMutation.mutate(selectedFile);
  };

  const handleClose = () => {
    setSelectedFile(null);
    setImportResults(null);
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Upload className="h-5 w-5" />
            Import Contacts from CSV
          </DialogTitle>
          <DialogDescription>
            Upload a CSV file to import multiple contacts at once. Make sure your CSV follows the required format.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {/* CSV Format Instructions */}
          <Card>
            <CardHeader>
              <CardTitle className="text-sm flex items-center gap-2">
                <FileText className="h-4 w-4" />
                Required CSV Format
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Your CSV file must contain the following columns (column names must match exactly):
              </p>
              
              <div className="grid grid-cols-2 gap-2 text-sm">
                <div className="space-y-1">
                  <Badge variant="outline" className="text-red-600 border-red-200">Required</Badge>
                  <div className="pl-2">
                    <div className="font-medium">First Name</div>
                    <div className="font-medium">Last Name</div>
                    <div className="font-medium">Phone</div>
                  </div>
                </div>
                <div className="space-y-1">
                  <Badge variant="outline" className="text-blue-600 border-blue-200">Optional</Badge>
                  <div className="pl-2">
                    <div>Email</div>
                    <div>Company Name</div>
                    <div>Status (defaults to "Lead")</div>
                  </div>
                </div>
              </div>

              <Alert>
                <AlertCircle className="h-4 w-4" />
                <AlertDescription className="text-sm">
                  <strong>Important:</strong> Contacts with duplicate phone numbers will be skipped. 
                  If a Company Name is provided and doesn't exist, it will be created automatically.
                </AlertDescription>
              </Alert>
            </CardContent>
          </Card>

          {/* File Upload */}
          <div className="space-y-3">
            <Label htmlFor="csv-file" className="text-sm font-medium">
              Select CSV File
            </Label>
            <div className="flex items-center gap-3">
              <Input
                id="csv-file"
                type="file"
                accept=".csv,text/csv"
                onChange={handleFileChange}
                disabled={importMutation.isPending}
                className="flex-1"
              />
              {selectedFile && (
                <div className="flex items-center gap-2 text-sm text-green-600">
                  <CheckCircle className="h-4 w-4" />
                  {selectedFile.name}
                </div>
              )}
            </div>
          </div>

          {/* Import Results */}
          {importResults && (
            <Card className="border-green-200 bg-green-50 dark:bg-green-900/10">
              <CardHeader>
                <CardTitle className="text-sm flex items-center gap-2 text-green-700 dark:text-green-400">
                  <CheckCircle className="h-4 w-4" />
                  Import Results
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <p className="text-sm text-green-700 dark:text-green-400 font-medium">
                  {importResults.message}
                </p>

                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div className="space-y-2">
                    <div className="flex justify-between">
                      <span>Total Rows:</span>
                      <Badge variant="outline">{importResults.summary.totalRows}</Badge>
                    </div>
                    <div className="flex justify-between">
                      <span>Successfully Imported:</span>
                      <Badge className="bg-green-100 text-green-800 border-green-200">
                        {importResults.summary.successfulImports}
                      </Badge>
                    </div>
                    <div className="flex justify-between">
                      <span>Companies Created:</span>
                      <Badge className="bg-blue-100 text-blue-800 border-blue-200">
                        {importResults.summary.companiesCreated}
                      </Badge>
                    </div>
                  </div>
                  <div className="space-y-2">
                    <div className="flex justify-between">
                      <span>Duplicates Skipped:</span>
                      <Badge className="bg-yellow-100 text-yellow-800 border-yellow-200">
                        {importResults.summary.duplicatesSkipped}
                      </Badge>
                    </div>
                    <div className="flex justify-between">
                      <span>Errors:</span>
                      <Badge 
                        className={
                          importResults.summary.errors > 0 
                            ? "bg-red-100 text-red-800 border-red-200"
                            : "bg-gray-100 text-gray-800 border-gray-200"
                        }
                      >
                        {importResults.summary.errors}
                      </Badge>
                    </div>
                  </div>
                </div>

                {/* Error Details */}
                {importResults.summary.errorDetails && importResults.summary.errorDetails.length > 0 && (
                  <div className="mt-4">
                    <Separator />
                    <div className="pt-3">
                      <h4 className="text-sm font-medium text-red-700 dark:text-red-400 mb-2">
                        Error Details:
                      </h4>
                      <div className="max-h-32 overflow-y-auto bg-red-50 dark:bg-red-900/20 rounded p-2">
                        {importResults.summary.errorDetails.map((error: string, index: number) => (
                          <div key={index} className="text-xs text-red-600 dark:text-red-400 mb-1">
                            {error}
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          )}

          {/* Action Buttons */}
          <div className="flex justify-end gap-3 pt-4">
            <Button 
              variant="outline" 
              onClick={handleClose}
              disabled={importMutation.isPending}
            >
              {importResults ? 'Close' : 'Cancel'}
            </Button>
            
            {!importResults && (
              <Button 
                onClick={handleImport}
                disabled={!selectedFile || importMutation.isPending}
                className="flex items-center gap-2"
              >
                {importMutation.isPending ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                    Importing...
                  </>
                ) : (
                  <>
                    <Upload className="h-4 w-4" />
                    Import Contacts
                  </>
                )}
              </Button>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default ImportCsvDialog; 