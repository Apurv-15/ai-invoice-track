import { Upload, FileText, CheckCircle2, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { useState, useRef } from "react";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import * as pdfjsLib from 'pdfjs-dist';

// Set up PDF.js worker
pdfjsLib.GlobalWorkerOptions.workerSrc = `//cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjsLib.version}/pdf.worker.min.js`;

export const UploadSection = () => {
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [detectionLogs, setDetectionLogs] = useState<string[]>([]);
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

      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("User not authenticated");

      setDetectionLogs(prev => [...prev, "Preparing image for AI extraction..."]);
      setUploadProgress(10);

      // Convert to base64
      let imageBase64: string;
      if (file.type === 'application/pdf') {
        setDetectionLogs(prev => [...prev, "Converting PDF to image..."]);
        imageBase64 = await convertPdfToImage(file);
      } else {
        imageBase64 = await fileToBase64(file);
      }

      setUploadProgress(30);
      setDetectionLogs(prev => [...prev, "Extracting invoice data with AI vision..."]);

      // Call AI extraction edge function
      const { data: extractedData, error: extractError } = await supabase.functions.invoke('extract-invoice-data', {
        body: { imageBase64 }
      });

      if (extractError) throw new Error(extractError.message || "Failed to extract invoice data");
      if (!extractedData || extractedData.error) {
        throw new Error(extractedData?.error || "Failed to extract invoice data");
      }

      setUploadProgress(60);
      setDetectionLogs(prev => [...prev, `✓ Vendor: ${extractedData.vendor}`]);
      setDetectionLogs(prev => [...prev, `✓ Amount: ₹${extractedData.amount}`]);
      setDetectionLogs(prev => [...prev, `✓ Category: ${extractedData.category} (${Math.round(extractedData.confidence * 100)}% confident)`]);

      setUploadProgress(70);
      setDetectionLogs(prev => [...prev, "Uploading file to storage..."]);

      // Upload file to Supabase storage
      const fileExt = file.name.split('.').pop();
      const fileName = `${user.id}/${Date.now()}.${fileExt}`;
      const { data: uploadData, error: uploadError } = await supabase.storage
        .from('invoice-documents')
        .upload(fileName, file);

      if (uploadError) throw uploadError;

      setUploadProgress(85);
      setDetectionLogs(prev => [...prev, "Saving invoice to database..."]);

      // Find category ID
      const { data: categories } = await (supabase as any)
        .from('invoice_categories')
        .select('id')
        .eq('name', extractedData.category)
        .single();

      // Insert invoice into database with all extracted data
      const { error: insertError } = await (supabase as any)
        .from('invoices')
        .insert({
          user_id: user.id,
          invoice_number: extractedData.invoice_number,
          vendor: extractedData.vendor,
          date: extractedData.date,
          amount: extractedData.amount,
          description: extractedData.description || '',
          file_url: uploadData.path,
          status: 'pending',
          category_id: categories?.id || null,
          category_confidence: extractedData.confidence
        });

      if (insertError) throw insertError;

      setUploadProgress(100);
      setDetectionLogs(prev => [...prev, "✅ Invoice uploaded successfully!"]);

      toast({
        title: "✅ Invoice Uploaded Successfully!",
        description: `${extractedData.invoice_number} from ${extractedData.vendor} - ₹${extractedData.amount.toLocaleString()}`,
      });

      setTimeout(() => {
        setIsUploading(false);
        setDetectionLogs([]);
      }, 1500);

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
  );
};