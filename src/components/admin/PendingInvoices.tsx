import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { CheckCircle, XCircle, Loader2, Mail } from "lucide-react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";

interface PendingInvoice {
  id: string;
  invoice_number: string;
  vendor: string;
  amount: number;
  date: string;
  user_id: string;
  category_id: string | null;
  category_confidence: number | null;
  profiles: {
    full_name: string;
    email: string;
  };
  invoice_categories: {
    name: string;
    color: string;
  } | null;
}

export const PendingInvoices = () => {
  const { toast } = useToast();
  const [invoices, setInvoices] = useState<PendingInvoice[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [rejectDialogOpen, setRejectDialogOpen] = useState(false);
  const [selectedInvoice, setSelectedInvoice] = useState<string | null>(null);
  const [rejectionReason, setRejectionReason] = useState("");
  const [sendingReminder, setSendingReminder] = useState(false);

  useEffect(() => {
    fetchPendingInvoices();

    // Subscribe to realtime changes
    const channel = supabase
      .channel('pending-invoices-changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'invoices',
          filter: 'status=eq.pending',
        },
        () => {
          fetchPendingInvoices();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  const fetchPendingInvoices = async () => {
    try {
      const { data, error } = await (supabase as any)
        .from('invoices')
        .select(`
          *,
          profiles!invoices_user_id_fkey (full_name, email),
          invoice_categories (name, color)
        `)
        .eq('status', 'pending')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setInvoices(data || []);
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleApprove = async (invoiceId: string) => {
    setActionLoading(invoiceId);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      
      const { error } = await (supabase as any)
        .from('invoices')
        .update({
          status: 'approved',
          reviewed_by: user?.id,
          reviewed_at: new Date().toISOString(),
        })
        .eq('id', invoiceId);

      if (error) throw error;

      toast({
        title: "Invoice approved",
        description: "The invoice has been approved successfully.",
      });

      fetchPendingInvoices();
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setActionLoading(null);
    }
  };

  const handleReject = async () => {
    if (!selectedInvoice || !rejectionReason.trim()) {
      toast({
        title: "Error",
        description: "Please provide a rejection reason.",
        variant: "destructive",
      });
      return;
    }

    setActionLoading(selectedInvoice);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      
      const { error } = await (supabase as any)
        .from('invoices')
        .update({
          status: 'rejected',
          reviewed_by: user?.id,
          reviewed_at: new Date().toISOString(),
          rejection_reason: rejectionReason,
        })
        .eq('id', selectedInvoice);

      if (error) throw error;

      toast({
        title: "Invoice rejected",
        description: "The invoice has been rejected.",
      });

      setRejectDialogOpen(false);
      setRejectionReason("");
      setSelectedInvoice(null);
      fetchPendingInvoices();
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setActionLoading(null);
    }
  };

  const openRejectDialog = (invoiceId: string) => {
    setSelectedInvoice(invoiceId);
    setRejectDialogOpen(true);
  };

  const sendReminderEmail = async () => {
    setSendingReminder(true);
    try {
      const { data, error } = await supabase.functions.invoke('send-admin-reminder');
      
      if (error) throw error;

      toast({
        title: "Reminder sent",
        description: data.message || "Admin reminder email has been sent successfully.",
      });
    } catch (error: any) {
      toast({
        title: "Error sending reminder",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setSendingReminder(false);
    }
  };

  if (loading) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </CardContent>
      </Card>
    );
  }

  return (
    <>
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4">
          <CardTitle>Pending Invoices ({invoices.length})</CardTitle>
          <Button 
            variant="outline" 
            size="sm"
            onClick={sendReminderEmail}
            disabled={sendingReminder || invoices.length === 0}
          >
            {sendingReminder ? (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : (
              <Mail className="mr-2 h-4 w-4" />
            )}
            Send Reminder
          </Button>
        </CardHeader>
        <CardContent>
          {invoices.length === 0 ? (
            <p className="text-center text-muted-foreground py-8">
              No pending invoices
            </p>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Invoice #</TableHead>
                    <TableHead>User</TableHead>
                    <TableHead>Vendor</TableHead>
                    <TableHead>Amount</TableHead>
                    <TableHead>Category</TableHead>
                    <TableHead>Date</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {invoices.map((invoice) => (
                    <TableRow key={invoice.id}>
                      <TableCell className="font-medium">{invoice.invoice_number}</TableCell>
                      <TableCell>
                        <div>
                          <div className="font-medium">{invoice.profiles.full_name}</div>
                          <div className="text-sm text-muted-foreground">{invoice.profiles.email}</div>
                        </div>
                      </TableCell>
                      <TableCell>{invoice.vendor}</TableCell>
                      <TableCell>₹{invoice.amount.toLocaleString()}</TableCell>
                      <TableCell>
                        {invoice.invoice_categories ? (
                          <Badge 
                            style={{ backgroundColor: invoice.invoice_categories.color }}
                            className="text-white"
                          >
                            {invoice.invoice_categories.name}
                            {invoice.category_confidence && (
                              <span className="ml-1 text-xs opacity-80">
                                ({Math.round(invoice.category_confidence * 100)}%)
                              </span>
                            )}
                          </Badge>
                        ) : (
                          <Badge variant="outline">Uncategorized</Badge>
                        )}
                      </TableCell>
                      <TableCell>{new Date(invoice.date).toLocaleDateString()}</TableCell>
                      <TableCell className="text-right space-x-2">
                        <Button
                          size="sm"
                          variant="default"
                          onClick={() => handleApprove(invoice.id)}
                          disabled={actionLoading === invoice.id}
                        >
                          {actionLoading === invoice.id ? (
                            <Loader2 className="h-4 w-4 animate-spin" />
                          ) : (
                            <>
                              <CheckCircle className="mr-1 h-4 w-4" />
                              Approve
                            </>
                          )}
                        </Button>
                        <Button
                          size="sm"
                          variant="destructive"
                          onClick={() => openRejectDialog(invoice.id)}
                          disabled={actionLoading === invoice.id}
                        >
                          <XCircle className="mr-1 h-4 w-4" />
                          Reject
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      <Dialog open={rejectDialogOpen} onOpenChange={setRejectDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Reject Invoice</DialogTitle>
            <DialogDescription>
              Please provide a reason for rejecting this invoice.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="reason">Rejection Reason</Label>
              <Textarea
                id="reason"
                placeholder="Enter the reason for rejection..."
                value={rejectionReason}
                onChange={(e) => setRejectionReason(e.target.value)}
                rows={4}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setRejectDialogOpen(false)}>
              Cancel
            </Button>
            <Button 
              variant="destructive" 
              onClick={handleReject}
              disabled={!rejectionReason.trim() || actionLoading === selectedInvoice}
            >
              {actionLoading === selectedInvoice && (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              )}
              Reject Invoice
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
};
