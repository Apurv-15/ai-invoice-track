import { Send, Calendar, Zap } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { useState } from "react";
import { useToast } from "@/hooks/use-toast";

export const AutomationPanel = () => {
  const [autoReminders, setAutoReminders] = useState(false);
  const { toast } = useToast();

  const handleSendReminders = () => {
    toast({
      title: "✅ Emails sent successfully!",
      description: "Payment reminders have been sent to all vendors.",
    });
  };

  return (
    <div className="glass-card rounded-2xl p-6 animate-scale-in">
      <div className="flex items-center gap-3 mb-6">
        <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-accent to-primary flex items-center justify-center shadow-lg">
          <Zap className="w-5 h-5 text-white" />
        </div>
        <h3 className="text-lg font-semibold">Automation</h3>
      </div>

      <div className="space-y-4">
        <Button
          onClick={handleSendReminders}
          className="w-full rounded-xl bg-gradient-to-r from-primary to-accent hover:opacity-90 smooth-transition shadow-lg h-12 font-semibold"
        >
          <Send className="w-5 h-5 mr-2" />
          Send Payment Reminders
        </Button>

        <div className="flex items-center justify-between p-4 rounded-xl bg-muted/50 border border-border/50">
          <div className="flex items-center gap-3">
            <Calendar className="w-5 h-5 text-muted-foreground" />
            <div>
              <Label htmlFor="auto-reminders" className="font-medium cursor-pointer">
                Auto-Schedule Reminders
              </Label>
              <p className="text-xs text-muted-foreground mt-1">
                Send weekly reminders automatically
              </p>
            </div>
          </div>
          <Switch
            id="auto-reminders"
            checked={autoReminders}
            onCheckedChange={setAutoReminders}
          />
        </div>

        <div className="pt-4 border-t border-border/50">
          <p className="text-sm text-muted-foreground mb-3">Quick Actions</p>
          <div className="space-y-2">
            <Button
              variant="ghost"
              className="w-full justify-start rounded-xl hover:bg-primary/10 smooth-transition"
            >
              Export All Invoices
            </Button>
            <Button
              variant="ghost"
              className="w-full justify-start rounded-xl hover:bg-primary/10 smooth-transition"
            >
              Generate Report
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};
