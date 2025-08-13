import React, { useState, useCallback } from 'react';
import { useDropzone } from 'react-dropzone';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Progress } from '@/components/ui/progress';
import { Upload, FileText, AlertCircle, CheckCircle, X } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface FileUploadModalProps {
  open: boolean;
  onClose: () => void;
  onUploadComplete: () => void;
}

interface UploadedFile {
  file: File;
  preview: string;
  uploading: boolean;
  progress: number;
  error?: string;
  success?: boolean;
}

const AFFILIATE_NETWORKS = [
  { value: 'amazon', label: 'Amazon Associates' },
  { value: 'cj', label: 'Commission Junction (CJ)' },
  { value: 'shareasale', label: 'ShareASale' },
  { value: 'rakuten', label: 'Rakuten Advertising' },
  { value: 'impact', label: 'Impact Radius' },
  { value: 'partnerize', label: 'Partnerize' },
  { value: 'avantlink', label: 'AvantLink' },
  { value: 'awin', label: 'AWIN' },
  { value: 'clickbank', label: 'ClickBank' },
  { value: 'other', label: 'Other Network' }
];

const SUPPORTED_FORMATS = [
  'text/csv',
  'application/vnd.ms-excel',
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  'application/xml',
  'text/xml',
  'application/json',
  'text/plain'
];

export function FileUploadModal({ open, onClose, onUploadComplete }: FileUploadModalProps) {
  const [files, setFiles] = useState<UploadedFile[]>([]);
  const [selectedNetwork, setSelectedNetwork] = useState<string>('');
  const [notes, setNotes] = useState<string>('');
  const [uploading, setUploading] = useState(false);
  const { toast } = useToast();

  const onDrop = useCallback((acceptedFiles: File[]) => {
    const newFiles = acceptedFiles.map(file => ({
      file,
      preview: file.name,
      uploading: false,
      progress: 0
    }));
    setFiles(prev => [...prev, ...newFiles]);
  }, []);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'text/csv': ['.csv'],
      'application/vnd.ms-excel': ['.xls'],
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': ['.xlsx'],
      'application/xml': ['.xml'],
      'text/xml': ['.xml'],
      'application/json': ['.json'],
      'text/plain': ['.txt']
    },
    maxSize: 50 * 1024 * 1024, // 50MB
    multiple: true
  });

  const removeFile = (index: number) => {
    setFiles(prev => prev.filter((_, i) => i !== index));
  };

  const uploadFiles = async () => {
    if (!selectedNetwork) {
      toast({
        title: "Network Required",
        description: "Please select an affiliate network",
        variant: "destructive"
      });
      return;
    }

    if (files.length === 0) {
      toast({
        title: "No Files",
        description: "Please select files to upload",
        variant: "destructive"
      });
      return;
    }

    setUploading(true);

    try {
      let processedCount = 0;
      let totalDeals = 0;

      for (let i = 0; i < files.length; i++) {
        const fileData = files[i];
        
        // Update file progress
        setFiles(prev => prev.map((f, idx) => 
          idx === i ? { ...f, uploading: true, progress: 0 } : f
        ));

        const formData = new FormData();
        formData.append('file', fileData.file);
        formData.append('network', selectedNetwork);
        formData.append('notes', notes);

        try {
          const response = await fetch('/api/admin/deals/upload', {
            method: 'POST',
            body: formData,
            headers: {
              'Authorization': `Bearer ${localStorage.getItem('admin_token')}`
            }
          });

          if (!response.ok) {
            throw new Error(`Upload failed: ${response.statusText}`);
          }

          const result = await response.json();
          
          setFiles(prev => prev.map((f, idx) => 
            idx === i ? { ...f, uploading: false, progress: 100, success: true } : f
          ));

          totalDeals += result.deals_processed || 0;
          processedCount++;

        } catch (error) {
          setFiles(prev => prev.map((f, idx) => 
            idx === i ? { ...f, uploading: false, error: error.message } : f
          ));
        }
      }

      if (processedCount > 0) {
        toast({
          title: "Upload Complete",
          description: `Successfully processed ${processedCount} file(s) with ${totalDeals} deals`,
          variant: "default"
        });
        onUploadComplete();
        handleClose();
      }

    } catch (error) {
      toast({
        title: "Upload Error",
        description: `Failed to upload files: ${error.message}`,
        variant: "destructive"
      });
    } finally {
      setUploading(false);
    }
  };

  const handleClose = () => {
    setFiles([]);
    setSelectedNetwork('');
    setNotes('');
    setUploading(false);
    onClose();
  };

  const getFileIcon = (file: File) => {
    if (file.type.includes('csv') || file.type.includes('excel') || file.type.includes('sheet')) {
      return <FileText className="h-8 w-8 text-green-500" />;
    }
    return <FileText className="h-8 w-8 text-blue-500" />;
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Upload Deal Files</DialogTitle>
          <DialogDescription>
            Upload deal files from affiliate networks that don't provide API access. 
            Supports CSV, Excel, XML, JSON, and text files.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {/* Network Selection */}
          <div className="space-y-2">
            <Label htmlFor="network">Affiliate Network *</Label>
            <Select value={selectedNetwork} onValueChange={setSelectedNetwork}>
              <SelectTrigger>
                <SelectValue placeholder="Select affiliate network..." />
              </SelectTrigger>
              <SelectContent>
                {AFFILIATE_NETWORKS.map(network => (
                  <SelectItem key={network.value} value={network.value}>
                    {network.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* File Upload Area */}
          <div
            {...getRootProps()}
            className={`border-2 border-dashed rounded-lg p-8 text-center cursor-pointer transition-colors ${
              isDragActive 
                ? 'border-primary bg-primary/5' 
                : 'border-gray-300 hover:border-gray-400'
            }`}
            data-testid="file-drop-zone"
          >
            <input {...getInputProps()} />
            <Upload className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            {isDragActive ? (
              <p className="text-lg">Drop the files here...</p>
            ) : (
              <div>
                <p className="text-lg mb-2">Drag & drop deal files here, or click to browse</p>
                <p className="text-sm text-gray-500">
                  Supports: CSV, Excel (.xls, .xlsx), XML, JSON, TXT files up to 50MB
                </p>
              </div>
            )}
          </div>

          {/* Uploaded Files List */}
          {files.length > 0 && (
            <div className="space-y-4">
              <Label>Uploaded Files ({files.length})</Label>
              <div className="space-y-3">
                {files.map((fileData, index) => (
                  <div key={index} className="flex items-center justify-between p-3 border rounded-lg">
                    <div className="flex items-center space-x-3">
                      {getFileIcon(fileData.file)}
                      <div>
                        <p className="font-medium">{fileData.file.name}</p>
                        <p className="text-sm text-gray-500">
                          {(fileData.file.size / 1024 / 1024).toFixed(2)} MB
                        </p>
                      </div>
                    </div>
                    
                    <div className="flex items-center space-x-2">
                      {fileData.uploading && (
                        <div className="w-24">
                          <Progress value={fileData.progress} className="h-2" />
                        </div>
                      )}
                      {fileData.success && (
                        <CheckCircle className="h-5 w-5 text-green-500" />
                      )}
                      {fileData.error && (
                        <div className="flex items-center space-x-1">
                          <AlertCircle className="h-5 w-5 text-red-500" />
                          <span className="text-sm text-red-500">{fileData.error}</span>
                        </div>
                      )}
                      {!fileData.uploading && !uploading && (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => removeFile(index)}
                          data-testid={`remove-file-${index}`}
                        >
                          <X className="h-4 w-4" />
                        </Button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Notes */}
          <div className="space-y-2">
            <Label htmlFor="notes">Notes (Optional)</Label>
            <Textarea
              id="notes"
              placeholder="Add any notes about this upload (e.g., file source, date range, special instructions...)"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={3}
              data-testid="upload-notes"
            />
          </div>

          {/* Action Buttons */}
          <div className="flex justify-end space-x-3 pt-4 border-t">
            <Button
              variant="outline"
              onClick={handleClose}
              disabled={uploading}
              data-testid="cancel-upload"
            >
              Cancel
            </Button>
            <Button
              onClick={uploadFiles}
              disabled={uploading || files.length === 0 || !selectedNetwork}
              data-testid="start-upload"
            >
              {uploading ? "Uploading..." : `Upload ${files.length} File(s)`}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}