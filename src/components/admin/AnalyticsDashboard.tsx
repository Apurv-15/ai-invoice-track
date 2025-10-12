import { useEffect, useState, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Loader2, TrendingUp, DollarSign, FileText, Users, RefreshCw } from "lucide-react";
import { PieChart, Pie, Cell, ResponsiveContainer, Legend, Tooltip, BarChart, Bar, XAxis, YAxis, CartesianGrid } from "recharts";
import { Button } from "@/components/ui/button";

interface AnalyticsData {
  totalSpending: number;
  pendingCount: number;
  avgInvoiceAmount: number;
  totalUsers: number;
  categoryBreakdown: { name: string; value: number; color: string }[];
  userSpending: { name: string; amount: number }[];
}

export const AnalyticsDashboard = () => {
  const { toast } = useToast();
  const [data, setData] = useState<AnalyticsData | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchAnalytics = useCallback(async () => {
    try {
      setLoading(true);

      // Fetch all invoices with categories
      const { data: invoices, error: invoicesError } = await supabase
        .from('invoices')
        .select(`
          *,
          profiles!invoices_user_id_fkey (full_name, email),
          invoice_categories (name, color)
        `);

      if (invoicesError) throw invoicesError;

      // Fetch user count
      const { count: userCount, error: userError } = await supabase
        .from('profiles')
        .select('*', { count: 'exact', head: true });

      if (userError) throw userError;

      // Calculate analytics
      const currentMonth = new Date().getMonth();
      const currentYear = new Date().getFullYear();

      const thisMonthInvoices = invoices.filter(inv => {
        const invDate = new Date(inv.date);
        return invDate.getMonth() === currentMonth && invDate.getFullYear() === currentYear;
      });

      const totalSpending = thisMonthInvoices.reduce((sum, inv) => sum + Number(inv.amount), 0);
      const pendingCount = invoices.filter(inv => inv.status === 'pending').length;
      const avgInvoiceAmount = thisMonthInvoices.length > 0
        ? totalSpending / thisMonthInvoices.length
        : 0;

      // Category breakdown
      const categoryMap = new Map<string, { value: number; color: string }>();
      thisMonthInvoices.forEach(inv => {
        if (inv.invoice_categories) {
          const existing = categoryMap.get(inv.invoice_categories.name) || { value: 0, color: inv.invoice_categories.color };
          categoryMap.set(inv.invoice_categories.name, {
            value: existing.value + Number(inv.amount),
            color: inv.invoice_categories.color,
          });
        }
      });

      const categoryBreakdown = Array.from(categoryMap.entries()).map(([name, data]) => ({
        name,
        value: data.value,
        color: data.color,
      }));

      // User spending
      const userMap = new Map<string, number>();
      thisMonthInvoices.forEach(inv => {
        const userName = inv.profiles?.full_name || 'Unknown';
        const existing = userMap.get(userName) || 0;
        userMap.set(userName, existing + Number(inv.amount));
      });

      const userSpending = Array.from(userMap.entries())
        .map(([name, amount]) => ({ name, amount }))
        .sort((a, b) => b.amount - a.amount)
        .slice(0, 10);

      setData({
        totalSpending,
        pendingCount,
        avgInvoiceAmount,
        totalUsers: userCount || 0,
        categoryBreakdown,
        userSpending,
      });
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  }, [toast]);

  useEffect(() => {
    fetchAnalytics();

    // Set up real-time subscriptions for invoice, user, and role changes
    const invoicesSubscription = supabase
      .channel('invoices_changes_analytics')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'invoices',
        },
        () => {
          fetchAnalytics();
        }
      )
      .subscribe();

    const profilesSubscription = supabase
      .channel('profiles_changes_analytics')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'profiles',
        },
        () => {
          fetchAnalytics();
        }
      )
      .subscribe();

    const rolesSubscription = supabase
      .channel('roles_changes_analytics')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'user_roles',
        },
        () => {
          fetchAnalytics();
        }
      )
      .subscribe();

    return () => {
      invoicesSubscription.unsubscribe();
      profilesSubscription.unsubscribe();
      rolesSubscription.unsubscribe();
    };
  }, [fetchAnalytics]);

  if (loading || !data) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header with refresh button */}
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold">Analytics Dashboard</h2>
        <Button
          variant="outline"
          size="sm"
          onClick={fetchAnalytics}
          disabled={loading}
        >
          <RefreshCw className={`mr-2 h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
          Refresh
        </Button>
      </div>

      {/* KPI Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Spending (This Month)</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">₹{data.totalSpending.toLocaleString()}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Pending Approvals</CardTitle>
            <FileText className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{data.pendingCount}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Avg Invoice Amount</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">₹{data.avgInvoiceAmount.toLocaleString(undefined, { maximumFractionDigits: 0 })}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Users</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{data.totalUsers}</div>
          </CardContent>
        </Card>
      </div>

      {/* Charts */}
      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Spending by Category</CardTitle>
          </CardHeader>
          <CardContent>
            {data.categoryBreakdown.length > 0 ? (
              <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                  <Pie
                    data={data.categoryBreakdown}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                    outerRadius={80}
                    fill="#8884d8"
                    dataKey="value"
                  >
                    {data.categoryBreakdown.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip formatter={(value: number) => `₹${value.toLocaleString()}`} />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <p className="text-center text-muted-foreground py-12">No data available</p>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Top 10 Users by Spending</CardTitle>
          </CardHeader>
          <CardContent>
            {data.userSpending.length > 0 ? (
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={data.userSpending}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="name" angle={-45} textAnchor="end" height={100} />
                  <YAxis />
                  <Tooltip formatter={(value: number) => `₹${value.toLocaleString()}`} />
                  <Bar dataKey="amount" fill="hsl(var(--primary))" />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <p className="text-center text-muted-foreground py-12">No data available</p>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
};
