import { Upload, FileText, CheckCircle2, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { useState, useRef } from "react";
import { useToast } from "@/hooks/use-toast";
import { auth, db, storage } from "@/integrations/firebase/config";
import { ref, uploadBytes, getDownloadURL } from "firebase/storage";
import { collection, addDoc, query, where, getDocs } from "firebase/firestore";
import * as pdfjsLib from 'pdfjs-dist';
import { DuplicateInvoiceDialog } from "./DuplicateInvoiceDialog";

// Set up PDF.js worker
pdfjsLib.GlobalWorkerOptions.workerSrc = `//cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjsLib.version}/pdf.worker.min.js`;

export const UploadSection = () => {
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [detectionLogs, setDetectionLogs] = useState<string[]>([]);
  const [duplicateDialogOpen, setDuplicateDialogOpen] = useState(false);
  const [existingInvoice, setExistingInvoice] = useState<any>(null);
  const [attemptedInvoiceNumber, setAttemptedInvoiceNumber] = useState("");
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();

  const fileToBase64 = async (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = () => {
        const base64 = (reader.result as string).split(',')[1];
        resolve(base64);
      };
      reader.onerror = reject;
    });
  };

  const convertPdfToImage = async (file: File): Promise<string> => {
    const arrayBuffer = await file.arrayBuffer();
    const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;
    const page = await pdf.getPage(1);

    const viewport = page.getViewport({ scale: 2.0 });
    const canvas = document.createElement('canvas');
    const context = canvas.getContext('2d')!;
    canvas.height = viewport.height;
    canvas.width = viewport.width;

    await page.render({
      canvasContext: context,
      viewport: viewport,
      canvas: canvas
    } as any).promise;

    return canvas.toDataURL('image/png').split(',')[1];
  };

  const handleViewExistingInvoice = (invoiceId: string) => {
    // Navigate to the invoice details or scroll to it in the table
    // For now, we'll just close the dialog and show a message
    toast({
      title: "View Invoice",
      description: "Navigate to the invoice details to view the existing invoice.",
    });
  };

  const processFile = async (file: File) => {
    setIsUploading(true);
    setUploadProgress(0);
    setDetectionLogs([]);

    try {
      // Validate file
      if (!file.type.match(/image\/(png|jpe?g)|application\/pdf/)) {
        throw new Error("Please upload a valid image (PNG, JPG) or PDF file");
      }

      if (file.size > 10 * 1024 * 1024) {
        throw new Error("File size must be less than 10MB");
      }

      const user = auth.currentUser;
      if (!user) throw new Error("User not authenticated");

      setDetectionLogs(prev => [...prev, "Uploading file to storage..."]);
      setUploadProgress(30);

      // Upload file to Firebase Storage
      const fileExt = file.name.split('.').pop();
      const fileName = `invoice-documents/${user.uid}/${Date.now()}.${fileExt}`;
      const storageRef = ref(storage, fileName);
      
      await uploadBytes(storageRef, file);
      const fileUrl = await getDownloadURL(storageRef);

      setUploadProgress(60);
      setDetectionLogs(prev => [...prev, "✓ File uploaded successfully"]);
      
      // Note: AI extraction features require Firebase Functions implementation
      // For now, we'll create a basic invoice entry that requires manual editing
      setDetectionLogs(prev => [...prev, "Creating invoice entry (manual editing required)..."]);

      const invoiceNumber = `INV-${Date.now()}`;
      const invoiceData = {
        user_id: user.uid,
        invoice_number: invoiceNumber,
        vendor: "Unknown Vendor",
        date: new Date(),
        amount: 0,
        description: "Please edit this invoice with correct details",
        file_url: fileUrl,
        status: 'pending',
        created_at: new Date(),
        updated_at: new Date(),
      };

      await addDoc(collection(db, 'invoices'), invoiceData);

      setUploadProgress(100);
      setDetectionLogs(prev => [...prev, "✅ Invoice uploaded successfully!"]);
      setDetectionLogs(prev => [...prev, "⚠️ AI extraction unavailable - please edit invoice details"]);

      toast({
        title: "✅ Invoice Uploaded!",
        description: "Please edit the invoice to add vendor and amount details.",
      });

      setTimeout(() => {
        setIsUploading(false);
        setDetectionLogs([]);
      }, 2000);

    } catch (error) {
      console.error('Upload Error:', error);
      toast({
        title: "❌ Upload Failed",
        description: error instanceof Error ? error.message : "Failed to process invoice",
        variant: "destructive",
      });
      setIsUploading(false);
      setDetectionLogs([]);
    }
  };

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      processFile(file);
    }
  };

  const handleDrop = (event: React.DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    const file = event.dataTransfer.files[0];
    if (file) {
      processFile(file);
    }
  };

  const handleDragOver = (event: React.DragEvent<HTMLDivElement>) => {
    event.preventDefault();
  };

  return (
    <>
      <div className="glass-card rounded-2xl p-6 animate-scale-in">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-primary to-accent flex items-center justify-center shadow-lg">
            <Upload className="w-5 h-5 text-white" />
          </div>
          <h3 className="text-lg font-semibold">Upload Invoices</h3>
        </div>

        <input
          ref={fileInputRef}
          type="file"
          accept="image/png,image/jpeg,image/jpg,application/pdf"
          onChange={handleFileSelect}
          className="hidden"
        />

        <div
          className="border-2 border-dashed border-border rounded-2xl p-8 text-center hover:border-primary smooth-transition cursor-pointer group"
          onDrop={handleDrop}
          onDragOver={handleDragOver}
          onClick={() => !isUploading && fileInputRef.current?.click()}
        >
          <div className="flex flex-col items-center gap-3">
            <div className="w-16 h-16 rounded-2xl bg-primary/10 flex items-center justify-center group-hover:scale-110 smooth-transition">
              {isUploading ? (
                <Loader2 className="w-8 h-8 text-primary animate-spin" />
              ) : (
                <FileText className="w-8 h-8 text-primary" />
              )}
            </div>
            <div>
              <p className="font-medium mb-1">
                Drop files here or click to upload
              </p>
              <p className="text-sm text-muted-foreground">
                PDF, JPG, PNG up to 10MB
              </p>
            </div>
            <Button
              disabled={isUploading}
              className="rounded-full bg-gradient-to-r from-primary to-accent hover:opacity-90 smooth-transition shadow-lg"
              onClick={(e) => {
                e.stopPropagation();
                fileInputRef.current?.click();
              }}
            >
              {isUploading ? "Processing..." : "Select Files"}
            </Button>
          </div>
        </div>

        {isUploading && (
          <div className="mt-4 space-y-2 animate-fade-in">
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground">Processing...</span>
              <span className="font-semibold">{uploadProgress}%</span>
            </div>
            <Progress value={uploadProgress} className="h-2" />
          </div>
        )}

        {(isUploading || detectionLogs.length > 0) && (
          <div className="mt-6 space-y-3">
            <h4 className="text-sm font-semibold mb-3">AI Detection Log</h4>
            <div className="space-y-2">
              {detectionLogs.map((log, index) => (
                <div
                  key={index}
                  className="flex items-center gap-2 text-sm text-muted-foreground animate-fade-in"
                >
                  <CheckCircle2 className="w-4 h-4 text-success" />
                  {log}
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      <DuplicateInvoiceDialog
        open={duplicateDialogOpen}
        onOpenChange={setDuplicateDialogOpen}
        existingInvoice={existingInvoice}
        attemptedInvoiceNumber={attemptedInvoiceNumber}
        onViewExisting={handleViewExistingInvoice}
      />
    </>
  );
};
