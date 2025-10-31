import { useEffect, useState, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Loader2, Bell, CheckCircle, Clock, AlertCircle, MessageSquare } from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

interface Reminder {
  id: string;
  user_id: string;
  title: string;
  message: string;
  priority: 'low' | 'medium' | 'high' | 'urgent';
  status: 'pending' | 'read' | 'resolved';
  category: 'general' | 'invoice' | 'payment' | 'technical' | 'urgent';
  admin_notes?: string;
  created_at: string;
  updated_at: string;
  read_at?: string;
  resolved_at?: string;
  invoice_id?: string;
  profiles?: {
    full_name: string;
    email: string;
  };
  invoices?: {
    invoice_number: string;
    vendor: string;
    amount: number;
  } | null;
}

export const AdminReminders = () => {
  const { toast } = useToast();
  const [reminders, setReminders] = useState<Reminder[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedReminder, setSelectedReminder] = useState<Reminder | null>(null);
  const [adminNotes, setAdminNotes] = useState("");
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  const fetchReminders = useCallback(async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('reminders')
        .select(`
          *,
          profiles!reminders_user_id_fkey (full_name, email),
          invoices (invoice_number, vendor, amount)
        `)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setReminders((data || []) as Reminder[]);
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
    fetchReminders();

    // Set up real-time subscription
    const subscription = supabase
      .channel('admin_reminders')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'reminders',
        },
        () => {
          fetchReminders();
        }
      )
      .subscribe();

    return () => {
      subscription.unsubscribe();
    };
  }, [fetchReminders]);

  const updateReminderStatus = async (reminderId: string, status: 'read' | 'resolved') => {
    setActionLoading(reminderId);
    try {
      const updateData: any = {
        status,
        updated_at: new Date().toISOString()
      };

      if (status === 'read') {
        updateData.read_at = new Date().toISOString();
      } else if (status === 'resolved') {
        updateData.resolved_at = new Date().toISOString();
      }

      const { error } = await (supabase as any)
        .from('reminders')
        .update(updateData)
        .eq('id', reminderId);

      if (error) throw error;

      toast({
        title: "Success",
        description: `Reminder marked as ${status}`,
      });

      fetchReminders();
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

  const sendExternalNotification = async (reminder: Reminder) => {
    try {
      // This would integrate with your preferred notification service
      // For now, we'll just mark it as sent
      const { error } = await (supabase as any)
        .from('reminders')
        .update({
          external_notification_sent: true,
          api_key_used: 'demo_api_key' // Replace with actual API key
        })
        .eq('id', reminder.id);

      if (error) throw error;

      toast({
        title: "Notification Sent",
        description: "External notification has been sent to admin",
      });

      fetchReminders();
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'urgent': return 'bg-red-500';
      case 'high': return 'bg-orange-500';
      case 'medium': return 'bg-yellow-500';
      case 'low': return 'bg-green-500';
      default: return 'bg-gray-500';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'resolved': return <CheckCircle className="h-4 w-4 text-green-500" />;
      case 'read': return <Clock className="h-4 w-4 text-blue-500" />;
      default: return <AlertCircle className="h-4 w-4 text-orange-500" />;
    }
  };

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case 'invoice': return '📄';
      case 'payment': return '💰';
      case 'technical': return '🔧';
      case 'urgent': return '🚨';
      default: return '💬';
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

  const pendingReminders = reminders.filter(r => r.status === 'pending');
  const readReminders = reminders.filter(r => r.status === 'read');
  const resolvedReminders = reminders.filter(r => r.status === 'resolved');

  return (
    <div className="space-y-6">
      {/* Summary Cards */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Pending</CardTitle>
            <Bell className="h-4 w-4 text-orange-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-orange-500">{pendingReminders.length}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Read</CardTitle>
            <Clock className="h-4 w-4 text-blue-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-500">{readReminders.length}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Resolved</CardTitle>
            <CheckCircle className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-500">{resolvedReminders.length}</div>
          </CardContent>
        </Card>
      </div>

      {/* Reminders Tabs */}
      <Tabs defaultValue="pending" className="space-y-6">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="pending">Pending ({pendingReminders.length})</TabsTrigger>
          <TabsTrigger value="read">Read ({readReminders.length})</TabsTrigger>
          <TabsTrigger value="resolved">Resolved ({resolvedReminders.length})</TabsTrigger>
        </TabsList>

        <TabsContent value="pending" className="space-y-4">
          {pendingReminders.length === 0 ? (
            <Card>
              <CardContent className="flex items-center justify-center py-12">
                <p className="text-muted-foreground">No pending reminders</p>
              </CardContent>
            </Card>
          ) : (
            pendingReminders.map((reminder) => (
              <Card key={reminder.id} className="border-l-4 border-l-orange-500">
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="text-2xl">{getCategoryIcon(reminder.category)}</div>
                      <div>
                        <CardTitle className="text-lg">{reminder.title}</CardTitle>
                        <p className="text-sm text-muted-foreground">
                          From: {reminder.profiles?.full_name} ({reminder.profiles?.email})
                        </p>
                        {reminder.invoices && (
                          <p className="text-sm font-medium text-primary">
                            Invoice: {reminder.invoices.invoice_number} - {reminder.invoices.vendor} (Rs {reminder.invoices.amount})
                          </p>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge className={getPriorityColor(reminder.priority)}>
                        {reminder.priority.toUpperCase()}
                      </Badge>
                      {getStatusIcon(reminder.status)}
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  <p className="text-sm">{reminder.message}</p>

                  <div className="flex items-center justify-between text-xs text-muted-foreground">
                    <span>Created: {new Date(reminder.created_at).toLocaleString()}</span>
                    <span>Category: {reminder.category}</span>
                  </div>

                  <div className="flex gap-2">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => updateReminderStatus(reminder.id, 'read')}
                      disabled={actionLoading === reminder.id}
                    >
                      Mark as Read
                    </Button>
                    <Button
                      size="sm"
                      onClick={() => updateReminderStatus(reminder.id, 'resolved')}
                      disabled={actionLoading === reminder.id}
                    >
                      Resolve
                    </Button>
                    <Button
                      size="sm"
                      variant="secondary"
                      onClick={() => sendExternalNotification(reminder)}
                    >
                      Send Notification
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))
          )}
        </TabsContent>

        <TabsContent value="read" className="space-y-4">
          {readReminders.length === 0 ? (
            <Card>
              <CardContent className="flex items-center justify-center py-12">
                <p className="text-muted-foreground">No read reminders</p>
              </CardContent>
            </Card>
          ) : (
            readReminders.map((reminder) => (
              <Card key={reminder.id} className="opacity-75">
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="text-2xl">{getCategoryIcon(reminder.category)}</div>
                      <div>
                        <CardTitle className="text-lg">{reminder.title}</CardTitle>
                        <p className="text-sm text-muted-foreground">
                          From: {reminder.profiles?.full_name}
                        </p>
                        {reminder.invoices && (
                          <p className="text-sm font-medium text-primary">
                            Invoice: {reminder.invoices.invoice_number}
                          </p>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge variant="secondary">{reminder.priority}</Badge>
                      {getStatusIcon(reminder.status)}
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <p className="text-sm">{reminder.message}</p>
                  <div className="flex items-center justify-between text-xs text-muted-foreground mt-2">
                    <span>Read: {reminder.read_at ? new Date(reminder.read_at).toLocaleString() : 'Unknown'}</span>
                    <span>Category: {reminder.category}</span>
                  </div>
                </CardContent>
              </Card>
            ))
          )}
        </TabsContent>

        <TabsContent value="resolved" className="space-y-4">
          {resolvedReminders.length === 0 ? (
            <Card>
              <CardContent className="flex items-center justify-center py-12">
                <p className="text-muted-foreground">No resolved reminders</p>
              </CardContent>
            </Card>
          ) : (
            resolvedReminders.map((reminder) => (
              <Card key={reminder.id} className="opacity-60">
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <CheckCircle className="h-5 w-5 text-green-500" />
                      <div>
                        <CardTitle className="text-lg">{reminder.title}</CardTitle>
                        <p className="text-sm text-muted-foreground">
                          From: {reminder.profiles?.full_name}
                        </p>
                        {reminder.invoices && (
                          <p className="text-sm font-medium text-primary">
                            Invoice: {reminder.invoices.invoice_number}
                          </p>
                        )}
                      </div>
                    </div>
                    <Badge variant="outline" className="text-green-600">Resolved</Badge>
                  </div>
                </CardHeader>
                <CardContent>
                  <p className="text-sm">{reminder.message}</p>
                  {reminder.admin_notes && (
                    <div className="mt-3 p-3 bg-muted rounded-md">
                      <p className="text-sm font-medium">Admin Notes:</p>
                      <p className="text-sm">{reminder.admin_notes}</p>
                    </div>
                  )}
                  <div className="flex items-center justify-between text-xs text-muted-foreground mt-2">
                    <span>Resolved: {reminder.resolved_at ? new Date(reminder.resolved_at).toLocaleString() : 'Unknown'}</span>
                  </div>
                </CardContent>
              </Card>
            ))
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
};
