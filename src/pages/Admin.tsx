import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { auth } from "@/integrations/firebase/config";
import { signOut } from "firebase/auth";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { LogOut, Bell } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { PendingInvoices } from "@/components/admin/PendingInvoices";
import { AllInvoices } from "@/components/admin/AllInvoices";
import { UsersManagement } from "@/components/admin/UsersManagement";
import { CategoriesManagement } from "@/components/admin/CategoriesManagement";
import { AdminReminders } from "@/components/admin/AdminReminders";
import { AnalyticsDashboard } from "@/components/admin/AnalyticsDashboard";

export default function Admin() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState("pending");

  const handleLogout = async () => {
    await signOut(auth);
    toast({
      title: "Logged out",
      description: "You've been logged out successfully.",
    });
    navigate("/auth");
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-primary/5">
      <header className="border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 sticky top-0 z-50">
        <div className="container flex h-16 items-center justify-between">
          <div className="flex items-center gap-4">
            <h1 className="text-2xl font-bold bg-gradient-to-r from-primary to-primary/60 bg-clip-text text-transparent">
              Admin Panel
            </h1>
          </div>
          <div className="flex items-center gap-4">
            <Button variant="ghost" size="icon">
              <Bell className="h-5 w-5" />
            </Button>
            <Button variant="outline" onClick={handleLogout}>
              <LogOut className="mr-2 h-4 w-4" />
              Logout
            </Button>
          </div>
        </div>
      </header>

      <main className="container py-8">
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <TabsList className="grid w-full grid-cols-6 lg:w-auto lg:inline-grid">
            <TabsTrigger value="pending">Pending</TabsTrigger>
            <TabsTrigger value="all">All Invoices</TabsTrigger>
            <TabsTrigger value="users">Users</TabsTrigger>
            <TabsTrigger value="categories">Categories</TabsTrigger>
            <TabsTrigger value="analytics">Analytics</TabsTrigger>
            <TabsTrigger value="reminders">Reminders</TabsTrigger>
          </TabsList>

          <TabsContent value="pending" className="space-y-6">
            <PendingInvoices />
          </TabsContent>

          <TabsContent value="all" className="space-y-6">
            <AllInvoices />
          </TabsContent>

          <TabsContent value="users" className="space-y-6">
            <UsersManagement />
          </TabsContent>

          <TabsContent value="categories" className="space-y-6">
            <CategoriesManagement />
          </TabsContent>

          <TabsContent value="analytics" className="space-y-6">
            <AnalyticsDashboard />
          </TabsContent>

          <TabsContent value="reminders" className="space-y-6">
            <AdminReminders />
          </TabsContent>
        </Tabs>
      </main>
    </div>
  );
}
