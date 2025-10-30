import { useEffect, useState } from "react";
import { auth, db } from "@/integrations/firebase/config";
import { collection, query, where, orderBy, onSnapshot, doc, getDoc } from "firebase/firestore";
import { useToast } from "@/hooks/use-toast";
import { Header } from "@/components/Header";
import { StatsCard } from "@/components/StatsCard";
import { InvoiceTable } from "@/components/InvoiceTable";
import { UploadSection } from "@/components/UploadSection";
import { UserReminders } from "@/components/UserReminders";
import {
  FileText,
  Clock,
  AlertCircle,
  IndianRupee,
} from "lucide-react";

interface Invoice {
  id: string;
  invoice_number: string;
  vendor: string;
  date: string;
  status: string;
  amount: number;
}

const Dashboard = () => {
  const { toast } = useToast();
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [loading, setLoading] = useState(true);
  const [userName, setUserName] = useState("User");

  useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged(async (user) => {
      if (user) {
        await fetchUserProfile(user.uid);
        setupInvoicesListener(user.uid);
      } else {
        setLoading(false);
      }
    });

    return () => unsubscribe();
  }, []);

  const setupInvoicesListener = (userId: string) => {
    const q = query(
      collection(db, 'invoices'),
      where('user_id', '==', userId),
      orderBy('created_at', 'desc')
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const invoicesData = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        date: doc.data().date?.toDate?.()?.toISOString() || doc.data().date
      })) as Invoice[];
      setInvoices(invoicesData);
      setLoading(false);
    }, (error) => {
      toast({
        title: "Error loading invoices",
        description: error.message,
        variant: "destructive",
      });
      setLoading(false);
    });

    return unsubscribe;
  };

  const fetchUserProfile = async (userId: string) => {
    try {
      const profileDoc = await getDoc(doc(db, 'profiles', userId));
      if (profileDoc.exists()) {
        const profile = profileDoc.data();
        if (profile?.full_name) {
          setUserName(profile.full_name.split(' ')[0]);
        }
      }
    } catch (error) {
      console.error('Error fetching profile:', error);
    }
  };
  
  const totalInvoices = invoices.length;
  const pendingCount = invoices.filter((i) => i.status === "pending").length;
  const unpaidCount = invoices.filter((i) => i.status === "unpaid" || i.status === "rejected").length;
  const amountDue = invoices
    .filter((i) => i.status !== "paid" && i.status !== "approved")
    .reduce((sum, i) => sum + Number(i.amount), 0);

  return (
    <div className="min-h-screen bg-background">
      <Header />

      <main className="container mx-auto px-6 py-8">
        {/* Welcome Message */}
        <div className="mb-8 animate-fade-in">
          <h2 className="text-3xl font-bold mb-2">Hey {userName} 👋</h2>
          <p className="text-muted-foreground">
            {unpaidCount > 0
              ? `You have ${unpaidCount} unpaid invoice${unpaidCount > 1 ? "s" : ""} this week.`
              : "All caught up! No unpaid invoices left 🎉"}
          </p>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <StatsCard
            title="Total Invoices"
            value={totalInvoices}
            icon={FileText}
            variant="default"
          />
          <StatsCard
            title="Pending"
            value={pendingCount}
            subtitle="Awaiting confirmation"
            icon={Clock}
            variant="warning"
          />
          <StatsCard
            title="Unpaid"
            value={unpaidCount}
            subtitle="Requires attention"
            icon={AlertCircle}
            variant="destructive"
          />
          <StatsCard
            title="Amount Due"
            value={`₹${amountDue.toLocaleString()}`}
            icon={IndianRupee}
            variant="default"
          />
        </div>

        {/* Main Content Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
          {/* Invoice Table - Takes 2 columns */}
          <div className="lg:col-span-2">
            <div className="mb-4">
              <h3 className="text-xl font-semibold">Recent Invoices</h3>
              <p className="text-sm text-muted-foreground">
                AI-powered invoice detection and categorization
              </p>
            </div>
            <InvoiceTable invoices={invoices} isAdmin={false} />
          </div>

          {/* Right Sidebar - Takes 1 column */}
          <div className="space-y-6">
            <UploadSection />
            {/* Temporarily commenting out AutomationPanel due to import issues */}
            {/* <AutomationPanel /> */}
            <UserReminders />
          </div>
        </div>
      </main>
    </div>
  );
};

export default Dashboard;
