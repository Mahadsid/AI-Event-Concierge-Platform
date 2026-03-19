import Link from "next/link";
import { Button } from "@/components/ui/button";
import HeroSection from "@/components/hero-section";
// from tailark install

export default function MarketingPage() {
    return (
        <>
            {/* Navbar */}
            <header className="fixed top-0 left-0 right-0 z-50 flex items-center justify-between px-6 py-4 border-b border-border/40 bg-background/80 backdrop-blur-sm">
                <div className="flex items-center gap-2">
                    <span className="text-lg font-semibold tracking-tight">
                        AI Event Concierge
                    </span>
                </div>
                <nav>
                    <Link
                        href="https://YOUR_PORTFOLIO_URL"
                        target="_blank"
                        className="text-sm text-muted-foreground hover:text-foreground transition-colors"
                    >
                        Built by SID
                    </Link>
                </nav>
            </header>

            {/* Hero — from Tailark, customized below */}
            <HeroSection />
        </>
    );
}