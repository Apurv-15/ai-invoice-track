import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Loader2, Search } from "lucide-react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

interface Invoice {
  id: string;
  invoice_number: string;
  vendor: string;
  amount: number;
  date: string;
  status: string;
  profiles: {
    full_name: string;
    email: string;
  };
  invoice_categories: {
    name: string;
    color: string;
  } | null;
}

export const AllInvoices = () => {
  const { toast } = useToast();
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [filteredInvoices, setFilteredInvoices] = useState<Invoice[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");

  useEffect(() => {
    fetchAllInvoices();
  }, []);

  useEffect(() => {
    filterInvoices();
  }, [searchTerm, statusFilter, invoices]);

  const fetchAllInvoices = async () => {
    try {
      const { data, error } = await (supabase as any)
        .from('invoices')
        .select(`
          *,
          profiles!invoices_user_id_fkey (full_name, email),
          invoice_categories (name, color)
        `)
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

  const filterInvoices = () => {
    let filtered = [...invoices];

    // Status filter
    if (statusFilter !== "all") {
      filtered = filtered.filter(inv => inv.status === statusFilter);
    }

    // Search filter
    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      filtered = filtered.filter(inv => 
        inv.invoice_number.toLowerCase().includes(term) ||
        inv.vendor.toLowerCase().includes(term) ||
        inv.profiles.full_name.toLowerCase().includes(term) ||
        inv.profiles.email.toLowerCase().includes(term)
      );
    }

    setFilteredInvoices(filtered);
  };

  const getStatusBadge = (status: string) => {
    const variants: Record<string, { variant: any; label: string }> = {
      pending: { variant: "secondary", label: "Pending" },
      approved: { variant: "default", label: "Approved" },
      rejected: { variant: "destructive", label: "Rejected" },
      paid: { variant: "outline", label: "Paid" },
    };

    const config = variants[status] || variants.pending;
    return <Badge variant={config.variant}>{config.label}</Badge>;
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
    <Card>
      <CardHeader>
        <CardTitle>All Invoices ({filteredInvoices.length})</CardTitle>
        <div className="flex gap-4 mt-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search invoices..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-9"
            />
          </div>
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-40">
              <SelectValue placeholder="Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Status</SelectItem>
              <SelectItem value="pending">Pending</SelectItem>
              <SelectItem value="approved">Approved</SelectItem>
              <SelectItem value="rejected">Rejected</SelectItem>
              <SelectItem value="paid">Paid</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </CardHeader>
      <CardContent>
        {filteredInvoices.length === 0 ? (
          <p className="text-center text-muted-foreground py-8">
            No invoices found
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
                  <TableHead>Status</TableHead>
                  <TableHead>Date</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredInvoices.map((invoice) => (
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
                        </Badge>
                      ) : (
                        <Badge variant="outline">Uncategorized</Badge>
                      )}
                    </TableCell>
                    <TableCell>{getStatusBadge(invoice.status)}</TableCell>
                    <TableCell>{new Date(invoice.date).toLocaleDateString()}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}
      </CardContent>
    </Card>
  );
};
