import Link from "next/link";

export default function DashboardLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    return (
        <div className="min-h-screen bg-background">
            <header className="border-b border-border/40 bg-background/95 backdrop-blur px-6 py-4 flex items-center justify-between">
                <div className="flex items-center gap-2">
                    <span className="text-lg font-semibold">EventAI</span>
                    <span className="text-xs text-muted-foreground bg-muted px-2 py-0.5 rounded-full">
                        Concierge
                    </span>
                </div>
                <Link href="/" className="text-sm text-muted-foreground hover:text-foreground transition-colors">
                    ← Back to Home
                </Link>
            </header>
            {children}
        </div>
    );
}