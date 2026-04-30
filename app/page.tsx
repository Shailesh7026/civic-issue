import Link from "next/link";
import { ArrowRight } from "lucide-react";

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-background flex flex-col">
      <header className="px-6 py-4 flex items-center justify-between border-b">
        <div className="font-bold text-xl text-primary">CivicIssue</div>
        <nav className="flex gap-4 items-center">
          <Link href="/login" className="text-sm font-medium hover:text-primary transition-colors">
            Login
          </Link>
          <Link 
            href="/login" 
            className="text-sm font-medium bg-primary text-primary-foreground px-4 py-2 rounded-xl hover:bg-primary/90 transition-colors"
          >
            Get Started
          </Link>
        </nav>
      </header>

      <main className="flex-1 flex flex-col items-center justify-center text-center px-4">
        <div className="absolute top-0 right-0 -z-10 w-96 h-96 bg-teal-100/50 rounded-full blur-3xl opacity-60 translate-x-1/3 -translate-y-1/3 pointer-events-none" />
        <div className="absolute top-1/4 left-0 -z-10 w-80 h-80 bg-indigo-100/40 rounded-full blur-3xl opacity-50 -translate-x-1/2 pointer-events-none" />
        
        <h1 className="text-5xl md:text-6xl font-extrabold tracking-tight mb-6 max-w-3xl">
          Empowering Communities to <span className="text-primary">Solve Issues</span> Together
        </h1>
        <p className="text-lg text-muted-foreground max-w-2xl mb-10">
          The ultimate platform for citizens to report local problems and for authorities to track, manage, and resolve them efficiently.
        </p>
        <div className="flex gap-4">
          <Link 
            href="/login" 
            className="inline-flex items-center justify-center gap-2 px-8 py-3.5 text-base font-semibold bg-primary text-primary-foreground rounded-2xl shadow-lg hover:shadow-xl hover:-translate-y-0.5 transition-all"
          >
            Start Reporting <ArrowRight className="w-5 h-5" />
          </Link>
        </div>
      </main>
    </div>
  );
}
