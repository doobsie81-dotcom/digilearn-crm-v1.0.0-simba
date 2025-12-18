import { ArrowRight, Home, Mail } from "lucide-react";
import Link from "next/link";
import { Separator } from "~/components/ui/separator";

export default function UnauthorizedPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-card via-border to-input flex items-center justify-center px-4">
      {/* Animated background blobs */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-red-500/10 rounded-full blur-3xl animate-pulse"></div>
        <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-orange-500/10 rounded-full blur-3xl animate-pulse delay-1000"></div>
      </div>

      {/* Content */}
      <div className="relative z-10 max-w-md w-full">
        {/* SVG Icon */}
        <div className="mb-8 flex justify-center">
          <svg
            viewBox="0 0 200 200"
            className="w-32 h-32 mb-4"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
          >
            {/* Lock shape */}
            <rect
              x="50"
              y="85"
              width="100"
              height="70"
              rx="8"
              stroke="url(#lockGradient)"
              strokeWidth="4"
            />
            {/* Lock top */}
            <path
              d="M 70 85 Q 70 55 100 55 Q 130 55 130 85"
              stroke="url(#lockGradient)"
              strokeWidth="4"
              fill="none"
            />
            {/* Lock hole */}
            <circle cx="100" cy="110" r="5" fill="url(#lockGradient)" />
            {/* Forbidden slash */}
            <line
              x1="30"
              y1="30"
              x2="170"
              y2="170"
              stroke="url(#forbiddenGradient)"
              strokeWidth="3"
              strokeLinecap="round"
            />
            <circle
              cx="100"
              cy="100"
              r="95"
              stroke="url(#forbiddenGradient)"
              strokeWidth="2"
              fill="none"
              opacity="0.5"
            />

            <defs>
              <linearGradient
                id="lockGradient"
                x1="0%"
                y1="0%"
                x2="100%"
                y2="100%"
              >
                <stop offset="0%" stopColor="var(--destructive-color" />
                <stop offset="100%" stopColor="#f97316" />
              </linearGradient>
              <linearGradient
                id="forbiddenGradient"
                x1="0%"
                y1="0%"
                x2="100%"
                y2="100%"
              >
                <stop offset="0%" stopColor="var(--primary-color)" />
                <stop offset="100%" stopColor="#dc2626" />
              </linearGradient>
            </defs>
          </svg>
        </div>

        {/* Text Content */}
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-destructive mb-3">
            Access Denied
          </h1>
          <p className="text-muted-forground text-lg leading-relaxed">
            You don&apos;t have permission to access this resource. If you
            believe this is an error, please contact support.
          </p>
        </div>

        {/* Action Buttons */}
        <div className="space-y-3">
          {/* Go to Main Dashboard */}
          <Link
            href="/"
            className="w-full group relative overflow-hidden transition-all duration-300 hover:shadow-lg hover:shadow-red-500/50"
          >
            <div className="relative bg-muted rounded-lg px-6 py-3 flex items-center justify-between group-hover:bg-muted/50 transition-colors">
              <span className="flex items-center gap-2 text-muted-foreground font-semibold">
                <Home className="w-5 h-5" />
                Go to Main Dashboard
              </span>
              <ArrowRight className="w-5 h-5 text-muted-foreground/60 group-hover:text-foreground group-hover:translate-x-1 transition-all" />
            </div>
          </Link>
          <div className="flex items-center h-12 my-4 gap-x-4">
            <Link href="/leads" className="text-primary hover:underline">
              My Leads
            </Link>
            <Separator orientation="vertical" />
            <Link href="/pipeline" className="text-primary hover:underline">
              My Deals
            </Link>
          </div>

          {/* Contact Support
          <a
            href="mailto:support@example.com"
            className="w-full group relative overflow-hidden rounded-lg border border-slate-700 p-0.5 transition-all duration-300 hover:border-orange-500/50"
          >
            <div className="relative bg-slate-900 rounded-lg px-6 py-3 flex items-center justify-between group-hover:bg-slate-800/50 transition-colors">
              <span className="flex items-center gap-2 text-slate-300 font-semibold group-hover:text-white transition-colors">
                <Mail className="w-5 h-5" />
                Contact Support
              </span>
              <ArrowRight className="w-5 h-5 text-slate-600 group-hover:text-orange-400 group-hover:translate-x-1 transition-all" />
            </div>
          </a> */}
        </div>

        {/* Footer Text */}
        <p className="text-center text-slate-500 text-sm mt-8">
          Error Code: <span className="font-mono text-slate-400">403</span>
        </p>
      </div>
    </div>
  );
}
