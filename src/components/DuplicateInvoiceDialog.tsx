import { AlertTriangle, Eye, FileText, Calendar, IndianRupee, Building2 } from "lucide-react";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";

interface ExistingInvoice {
  id: string;
  invoice_number: string;
  vendor: string;
  date: string;
  amount: number;
  status: string;
  description?: string;
  file_url?: string;
}

interface DuplicateInvoiceDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  existingInvoice: ExistingInvoice | null;
  attemptedInvoiceNumber: string;
  onViewExisting?: (invoiceId: string) => void;
}

const statusConfig: Record<string, { label: string; className: string }> = {
  paid: {
    label: "Paid",
    className: "bg-success/20 text-success border-success/30",
  },
  pending: {
    label: "Pending",
    className: "bg-warning/20 text-warning border-warning/30",
  },
  unpaid: {
    label: "Unpaid",
    className: "bg-destructive/20 text-destructive border-destructive/30",
  },
  approved: {
    label: "Approved",
    className: "bg-primary/20 text-primary border-primary/30",
  },
  rejected: {
    label: "Rejected",
    className: "bg-destructive/20 text-destructive border-destructive/30",
  },
};

export const DuplicateInvoiceDialog = ({
  open,
  onOpenChange,
  existingInvoice,
  attemptedInvoiceNumber,
  onViewExisting,
}: DuplicateInvoiceDialogProps) => {
  const handleViewExisting = () => {
    if (existingInvoice && onViewExisting) {
      onViewExisting(existingInvoice.id);
    }
    onOpenChange(false);
  };

  const formatDate = (dateString: string) => {
    try {
      return new Date(dateString).toLocaleDateString('en-IN', {
        day: 'numeric',
        month: 'short',
        year: 'numeric'
      });
    } catch {
      return dateString;
    }
  };

  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent className="sm:max-w-[500px]">
        <AlertDialogHeader>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-orange-100 dark:bg-orange-900/20 flex items-center justify-center">
              <AlertTriangle className="w-5 h-5 text-orange-600 dark:text-orange-400" />
            </div>
            <div>
              <AlertDialogTitle className="text-xl">
                Duplicate Invoice Detected
              </AlertDialogTitle>
              <AlertDialogDescription className="text-base mt-1">
                This invoice is already submitted in your account
              </AlertDialogDescription>
            </div>
          </div>
        </AlertDialogHeader>

        {existingInvoice && (
          <div className="space-y-4">
            <div className="text-sm text-muted-foreground mb-3">
              <strong>Invoice Number:</strong> {attemptedInvoiceNumber}
            </div>

            <Card className="border-l-4 border-l-orange-500">
              <CardContent className="p-4 space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <FileText className="w-4 h-4 text-primary" />
                    <span className="font-mono font-medium">
                      {existingInvoice.invoice_number}
                    </span>
                  </div>
                  <Badge
                    variant="outline"
                    className={cn(
                      "rounded-full px-3 py-1 text-xs font-semibold border",
                      statusConfig[existingInvoice.status]?.className || "bg-gray-100 text-gray-800"
                    )}
                  >
                    {statusConfig[existingInvoice.status]?.label || existingInvoice.status}
                  </Badge>
                </div>

                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div className="flex items-center gap-2">
                    <Building2 className="w-4 h-4 text-muted-foreground" />
                    <span className="font-medium">{existingInvoice.vendor}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <IndianRupee className="w-4 h-4 text-muted-foreground" />
                    <span className="font-semibold">
                      ₹{existingInvoice.amount.toLocaleString()}
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Calendar className="w-4 h-4 text-muted-foreground" />
                    <span>{formatDate(existingInvoice.date)}</span>
                  </div>
                  {existingInvoice.description && (
                    <div className="col-span-2 text-muted-foreground text-xs">
                      {existingInvoice.description}
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>

            <div className="bg-blue-50 dark:bg-blue-950/20 border border-blue-200 dark:border-blue-800 rounded-lg p-3">
              <p className="text-sm text-blue-800 dark:text-blue-200">
                💡 <strong>Tip:</strong> Each invoice number must be unique in your account.
                If you received the same invoice twice, please upload only once.
              </p>
            </div>
          </div>
        )}

        <AlertDialogFooter className="gap-2">
          <AlertDialogCancel>Cancel</AlertDialogCancel>
          {existingInvoice && onViewExisting && (
            <AlertDialogAction
              onClick={handleViewExisting}
              className="bg-primary hover:bg-primary/90"
            >
              <Eye className="w-4 h-4 mr-2" />
              View Existing Invoice
            </AlertDialogAction>
          )}
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
};
