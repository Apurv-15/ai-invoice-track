import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Sparkles, Zap, Shield, ArrowRight } from "lucide-react";
import LiquidEther from "@/components/LiquidEther";

export default function Landing() {
  const navigate = useNavigate();

  const handleGetStarted = () => {
    navigate("/dashboard");
  };

  return (
    <div className="relative min-h-screen overflow-hidden">
      {/* Liquid Ether Background */}
      <div className="absolute inset-0 z-0">
        <LiquidEther
          colors={['#5B9AFE', '#A78BFA', '#EC4899']}
          mouseForce={25}
          cursorSize={120}
          autoDemo={true}
          autoSpeed={0.4}
          autoIntensity={2.5}
          className="w-full h-full"
        />
      </div>

      {/* Content Overlay */}
      <div className="relative z-10 min-h-screen flex flex-col">
        {/* Header */}
        <header className="container mx-auto px-6 py-6">
          <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
              <div className="w-10 h-10 rounded-xl gradient-primary flex items-center justify-center">
                <Sparkles className="w-6 h-6 text-white" />
              </div>
              <span className="text-2xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-primary to-accent">
                InvoSmart AI
              </span>
            </div>
            <div className="flex items-center gap-3">
              <Button 
                variant="outline" 
                onClick={handleGetStarted}
                className="glass hover:bg-primary/10"
              >
                Sign In
              </Button>
              <Button 
                variant="outline" 
                onClick={() => navigate("/auth?type=admin")}
                className="glass hover:bg-primary/10 border-primary/30"
              >
                <Shield className="mr-2 h-4 w-4" />
                Admin Login
              </Button>
            </div>
          </div>
        </header>

        {/* Hero Section */}
        <main className="flex-1 container mx-auto px-6 flex items-center">
          <div className="max-w-4xl mx-auto text-center space-y-8 animate-fade-in">
            {/* Main Headline */}
            <div className="space-y-4">
              <h1 className="text-5xl md:text-7xl font-bold leading-tight">
                <span className="bg-clip-text text-transparent bg-gradient-to-r from-primary via-accent to-primary bg-[length:200%_auto] animate-[gradient_3s_linear_infinite]">
                  Invoice Automation
                </span>
                <br />
                <span className="text-foreground">Powered by AI</span>
              </h1>
              <p className="text-xl md:text-2xl text-muted-foreground max-w-2xl mx-auto">
                Transform your invoice management with intelligent automation. 
                Process, categorize, and manage invoices in seconds.
              </p>
            </div>

            {/* CTA Buttons */}
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button 
                size="lg" 
                onClick={handleGetStarted}
                className="text-lg px-8 py-6 gradient-primary hover:opacity-90 transition-opacity group"
              >
                Get Started
                <ArrowRight className="ml-2 w-5 h-5 group-hover:translate-x-1 transition-transform" />
              </Button>
              <Button 
                size="lg" 
                variant="outline"
                className="text-lg px-8 py-6 glass hover:bg-primary/10"
              >
                Watch Demo
              </Button>
            </div>

            {/* Feature Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 pt-12">
              <div className="glass-card p-6 rounded-2xl space-y-3 hover-scale smooth-transition">
                <div className="w-12 h-12 rounded-xl gradient-primary flex items-center justify-center">
                  <Zap className="w-6 h-6 text-white" />
                </div>
                <h3 className="text-xl font-semibold">Lightning Fast</h3>
                <p className="text-muted-foreground">
                  Process invoices instantly with our advanced AI engine
                </p>
              </div>

              <div className="glass-card p-6 rounded-2xl space-y-3 hover-scale smooth-transition">
                <div className="w-12 h-12 rounded-xl gradient-primary flex items-center justify-center">
                  <Sparkles className="w-6 h-6 text-white" />
                </div>
                <h3 className="text-xl font-semibold">Smart Detection</h3>
                <p className="text-muted-foreground">
                  Automatically extract and categorize invoice data
                </p>
              </div>

              <div className="glass-card p-6 rounded-2xl space-y-3 hover-scale smooth-transition">
                <div className="w-12 h-12 rounded-xl gradient-primary flex items-center justify-center">
                  <Shield className="w-6 h-6 text-white" />
                </div>
                <h3 className="text-xl font-semibold">Secure & Reliable</h3>
                <p className="text-muted-foreground">
                  Enterprise-grade security for your sensitive data
                </p>
              </div>
            </div>
          </div>
        </main>

        {/* Footer */}
        <footer className="container mx-auto px-6 py-6 text-center text-sm text-muted-foreground">
          <p>© 2024 InvoSmart AI. All rights reserved.</p>
        </footer>
      </div>
    </div>
  );
}
