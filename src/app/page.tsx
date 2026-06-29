import Link from "next/link";
import { ArrowRight, Sparkles, TrendingUp, Clock } from "lucide-react";

export default function Home() {
  return (
    <div className="flex flex-col items-center justify-center min-h-[calc(100vh-64px)] p-6 relative overflow-hidden">
      {/* Decorative background elements */}
      <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-primary/20 rounded-full blur-[120px] mix-blend-screen animate-float pointer-events-none" />
      <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-accent/20 rounded-full blur-[120px] mix-blend-screen animate-float pointer-events-none" style={{ animationDelay: "3s" }} />

      <main className="flex flex-col items-center text-center max-w-4xl z-10 space-y-8 animate-in fade-in slide-in-from-bottom-8 duration-1000">
        <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full glass border border-white/20 shadow-sm text-sm font-medium mb-4">
          <Sparkles className="w-4 h-4 text-accent" />
          <span>Smarter park navigation</span>
        </div>

        <h1 className="text-5xl md:text-7xl font-extrabold tracking-tight leading-tight">
          Master the Magic with <br />
          <span className="text-gradient">Predictive Insights</span>
        </h1>
        
        <p className="text-lg md:text-xl text-muted-foreground max-w-2xl leading-relaxed">
          Unlock the power of data to track wait time trends, forecast crowds, and get the absolute most out of your Disneyland experience.
        </p>

        <div className="pt-8">
          <Link 
            href='/wait-times'
            className="group relative inline-flex items-center justify-center gap-2 px-8 py-4 text-base font-semibold text-white transition-all duration-300 bg-primary hover:bg-primary/90 rounded-full shadow-[0_0_40px_-10px_var(--color-primary)] hover:shadow-[0_0_60px_-15px_var(--color-primary)] hover:scale-105"
          >
            <span>Explore Wait Times</span>
            <ArrowRight className="w-5 h-5 transition-transform group-hover:translate-x-1" />
          </Link>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 pt-16 w-full">
          <div className="glass-card p-6 rounded-2xl flex flex-col items-center text-center space-y-3">
            <div className="p-3 bg-primary/10 rounded-full">
              <Clock className="w-6 h-6 text-primary" />
            </div>
            <h3 className="font-semibold text-lg">Real-Time Tracking</h3>
            <p className="text-sm text-muted-foreground">Live updates on attraction wait times across the park.</p>
          </div>
          <div className="glass-card p-6 rounded-2xl flex flex-col items-center text-center space-y-3">
            <div className="p-3 bg-accent/10 rounded-full">
              <TrendingUp className="w-6 h-6 text-accent" />
            </div>
            <h3 className="font-semibold text-lg">Trend Analysis</h3>
            <p className="text-sm text-muted-foreground">Historical data to help you spot the best times to ride.</p>
          </div>
          <div className="glass-card p-6 rounded-2xl flex flex-col items-center text-center space-y-3">
            <div className="p-3 bg-chart-1/10 rounded-full">
              <Sparkles className="w-6 h-6 text-chart-1" />
            </div>
            <h3 className="font-semibold text-lg">Smart Forecasting</h3>
            <p className="text-sm text-muted-foreground">Predictive models to optimize your daily itinerary.</p>
          </div>
        </div>
      </main>
    </div>
  );
}
