import { useState, useEffect } from "react";
import { Eye } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { DuplicateInvoiceDialog } from "./DuplicateInvoiceDialog";
import { cn } from "@/lib/utils";
import { InvoiceDetailsDialog } from "./InvoiceDetailsDialog";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

export type InvoiceStatus = "paid" | "pending" | "unpaid" | "approved" | "rejected";

export interface Invoice {
  id: string;
  invoice_number: string;
  vendor: string;
  date: string;
  status: InvoiceStatus;
  amount: number;
  recipient_email?: string;
  description?: string;
}

interface InvoiceTableProps {
  invoices: Array<{
    id: string;
    invoice_number: string;
    vendor: string;
    date: string;
    status: string;
    amount: number;
    recipient_email?: string;
    description?: string;
  }>;
  isAdmin?: boolean;
}

interface DialogState {
  type: "details" | null;
  invoice: Invoice | null;
}

const statusConfig: Record<
  InvoiceStatus,
  { label: string; className: string }
> = {
  paid: {
    label: "Paid",
    className: "bg-success/20 text-success border-success/30 hover:bg-success/30",
  },
  pending: {
    label: "Pending",
    className: "bg-warning/20 text-warning border-warning/30 hover:bg-warning/30",
  },
  unpaid: {
    label: "Unpaid",
    className: "bg-destructive/20 text-destructive border-destructive/30 hover:bg-destructive/30",
  },
  approved: {
    label: "Approved",
    className: "bg-primary/20 text-primary border-primary/30 hover:bg-primary/30",
  },
  rejected: {
    label: "Rejected",
    className: "bg-destructive/20 text-destructive border-destructive/30 hover:bg-destructive/30",
  },
};

export const InvoiceTable = ({ invoices: initialInvoices, isAdmin = true }: InvoiceTableProps) => {
  const { toast } = useToast();
  const [dialogState, setDialogState] = useState<DialogState>({
    type: null,
    invoice: null,
  });

  // Duplicate invoice dialog state
  const [duplicateDialogOpen, setDuplicateDialogOpen] = useState(false);
  const [existingInvoice, setExistingInvoice] = useState<any>(null);
  const [attemptedInvoiceNumber, setAttemptedInvoiceNumber] = useState("");

  const handleViewExistingInvoice = (invoiceId: string) => {
    // Find the invoice in the current list and open its details
    const invoice = initialInvoices.find(inv => inv.id === invoiceId);
    if (invoice) {
      const convertedInvoice = convertToInvoice(invoice);
      handleOpenDialog("details", convertedInvoice);
    }
    setDuplicateDialogOpen(false);
  };

  const handleStatusChange = async (invoiceId: string, newStatus: InvoiceStatus) => {
    try {
      const { error } = await (supabase as any)
        .from('invoices')
        .update({ status: newStatus })
        .eq('id', invoiceId);

      if (error) throw error;

      toast({
        title: "Status updated",
        description: `Invoice status changed to ${newStatus}`,
      });
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  const handleOpenDialog = (type: "details", invoice: Invoice) => {
    setDialogState({ type, invoice });
  };

  const handleCloseDialog = () => {
    setDialogState({ type: null, invoice: null });
  };

  const handleSaveInvoice = async (updates: Partial<Invoice>) => {
    if (!dialogState.invoice) return;

    try {
      // Check for duplicate invoice number if it's being changed
      if (updates.invoice_number && updates.invoice_number !== dialogState.invoice.invoice_number) {
        const { data: { user } } = await supabase.auth.getUser();
        if (user) {
          const { data: existingInvoiceData, error: checkError } = await (supabase as any)
            .from('invoices')
            .select('*')
            .eq('user_id', user.id)
            .eq('invoice_number', updates.invoice_number)
            .neq('id', dialogState.invoice.id) // Exclude current invoice
            .single();

          if (checkError && checkError.code !== 'PGRST116') { // PGRST116 is "not found" error
            throw checkError;
          }

          if (existingInvoiceData) {
            // Show duplicate dialog instead of throwing error
            setExistingInvoice(existingInvoiceData);
            setAttemptedInvoiceNumber(updates.invoice_number);
            setDuplicateDialogOpen(true);
            return;
          }
        }
      }

      const { error } = await (supabase as any)
        .from('invoices')
        .update(updates)
        .eq('id', dialogState.invoice.id);

      if (error) throw error;

      toast({
        title: "Invoice updated",
        description: "Changes saved successfully",
      });

      handleCloseDialog();
    } catch (error: any) {
      // Handle specific database constraint violations
      if (error.message.includes('unique_user_invoice_number') ||
          error.message.includes('duplicate key value') ||
          error.message.includes('violates unique constraint')) {
        toast({
          title: "❌ Duplicate Invoice Number",
          description: "An invoice with this number already exists in your account.",
          variant: "destructive",
        });
      } else {
        toast({
          title: "Error",
          description: error.message,
          variant: "destructive",
        });
      }
    }
  };

  const convertToInvoice = (inv: typeof initialInvoices[0]): Invoice => ({
    id: inv.id,
    invoice_number: inv.invoice_number,
    vendor: inv.vendor,
    date: new Date(inv.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }),
    status: inv.status as InvoiceStatus,
    amount: Number(inv.amount),
    recipient_email: inv.recipient_email,
    description: inv.description,
  });

  return (
    <>
      <div className="glass-card rounded-2xl overflow-hidden animate-fade-in">
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="border-b border-border/50">
              <th className="text-left p-4 text-sm font-semibold text-muted-foreground">
                Invoice No.
              </th>
              <th className="text-left p-4 text-sm font-semibold text-muted-foreground">
                Vendor
              </th>
              <th className="text-left p-4 text-sm font-semibold text-muted-foreground">
                Date
              </th>
              <th className="text-left p-4 text-sm font-semibold text-muted-foreground">
                Status
              </th>
              <th className="text-left p-4 text-sm font-semibold text-muted-foreground">
                Amount
              </th>
              <th className="text-right p-4 text-sm font-semibold text-muted-foreground">
                Actions
              </th>
            </tr>
          </thead>
          <tbody>
            {initialInvoices.map((inv, index) => {
              const invoice = convertToInvoice(inv);
              return (
                <tr
                  key={invoice.id}
                  className="border-b border-border/30 hover:bg-white/30 dark:hover:bg-white/5 smooth-transition"
                  style={{ animationDelay: `${index * 0.05}s` }}
                >
                  <td className="p-4">
                    <span className="font-mono text-sm font-medium">
                      {invoice.invoice_number}
                    </span>
                  </td>
                  <td className="p-4">
                    <span className="font-medium">{invoice.vendor}</span>
                  </td>
                  <td className="p-4">
                    <span className="text-sm text-muted-foreground">
                      {invoice.date}
                    </span>
                  </td>
                  <td className="p-4">
                    {isAdmin ? (
                      <Select
                        value={invoice.status}
                        onValueChange={(value: InvoiceStatus) =>
                          handleStatusChange(invoice.id, value)
                        }
                      >
                        <SelectTrigger className="w-[130px] border-0 bg-transparent">
                          <SelectValue>
                            <Badge
                              variant="outline"
                              className={cn(
                                "rounded-full px-3 py-1 text-xs font-semibold border smooth-transition",
                                statusConfig[invoice.status].className
                              )}
                            >
                              {statusConfig[invoice.status].label}
                            </Badge>
                          </SelectValue>
                        </SelectTrigger>
                        <SelectContent>
                          {Object.entries(statusConfig).map(([status, config]) => (
                            <SelectItem key={status} value={status}>
                              <Badge
                                variant="outline"
                                className={cn(
                                  "rounded-full px-3 py-1 text-xs font-semibold border",
                                  config.className
                                )}
                              >
                                {config.label}
                              </Badge>
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    ) : (
                      <Badge
                        variant="outline"
                        className={cn(
                          "rounded-full px-3 py-1 text-xs font-semibold border",
                          statusConfig[invoice.status].className
                        )}
                      >
                        {statusConfig[invoice.status].label}
                      </Badge>
                    )}
                  </td>
                  <td className="p-4">
                    <span className="font-semibold">
                      ₹{invoice.amount.toLocaleString()}
                    </span>
                  </td>
                  <td className="p-4">
                    <div className="flex items-center justify-end gap-2">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleOpenDialog("details", invoice)}
                        className="rounded-full hover:bg-primary/10 hover:text-primary smooth-transition"
                      >
                        <Eye className="w-4 h-4 mr-1" />
                        View
                      </Button>
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>

      {dialogState.invoice && dialogState.type === "details" && (
        <InvoiceDetailsDialog
          open={true}
          onOpenChange={handleCloseDialog}
          invoice={dialogState.invoice}
          onSave={handleSaveInvoice}
        />
      )}

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