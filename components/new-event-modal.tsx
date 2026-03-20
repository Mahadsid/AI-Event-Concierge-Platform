"use client";

import { useState } from "react";
import {
    Dialog, DialogContent, DialogHeader,
    DialogTitle, DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Sparkles, Loader2 } from "lucide-react";

interface NewEventModalProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    onSubmit: (rawInput: string) => void;
    isPending: boolean;
}

export function NewEventModal({
    open, onOpenChange, onSubmit, isPending,
}: NewEventModalProps) {
    const [value, setValue] = useState("");

    const examples = [
        "A 10-person leadership retreat in the mountains for 3 days with a $4k budget",
        "Team building offsite for 25 people near the beach, 2 days, budget $8,000",
        "Annual company retreat for 50 employees, 4 days, prefer hill stations in India",
    ];

    const handleSubmit = () => {
        if (!value.trim() || isPending) return;
        onSubmit(value.trim());
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-lg">
                <DialogHeader>
                    <DialogTitle className="flex items-center gap-2">
                        <Sparkles className="w-5 h-5 text-primary" />
                        Plan a New Event
                    </DialogTitle>
                    <DialogDescription>
                        Describe your event in plain English. Include group size, duration,
                        location preference, and budget for best results.
                    </DialogDescription>
                </DialogHeader>

                <div className="space-y-4 pt-2">
                    <Textarea
                        placeholder="e.g. A 10-person leadership retreat in the mountains for 3 days with a $4k budget..."
                        className="min-h-[120px] resize-none"
                        value={value}
                        onChange={(e) => setValue(e.target.value)}
                        disabled={isPending}
                    />

                    {/* Example chips */}
                    {!isPending && (
                        <div className="space-y-2">
                            <p className="text-xs text-muted-foreground">Try an example:</p>
                            <div className="flex flex-wrap gap-2">
                                {examples.map((ex) => (
                                    <button
                                        key={ex}
                                        onClick={() => setValue(ex)}
                                        className="text-xs px-3 py-1.5 rounded-full border border-border bg-muted/50 hover:bg-muted transition-colors text-left"
                                    >
                                        {ex.slice(0, 45)}…
                                    </button>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* Loading state */}
                    {isPending && (
                        <div className="flex items-center gap-3 p-4 rounded-lg bg-muted/50 border border-border">
                            <div className="relative">
                                <Loader2 className="w-5 h-5 animate-spin text-primary" />
                            </div>
                            <div>
                                <p className="text-sm font-medium">AI is planning your event...</p>
                                <p className="text-xs text-muted-foreground">
                                    Searching for the perfect venue
                                </p>
                            </div>
                        </div>
                    )}

                    <div className="flex justify-end gap-2 pt-2">
                        <Button
                            variant="outline"
                            onClick={() => onOpenChange(false)}
                            disabled={isPending}
                        >
                            Cancel
                        </Button>
                        <Button
                            onClick={handleSubmit}
                            disabled={!value.trim() || isPending}
                            className="gap-2 cursor-pointer"
                        >
                            {isPending ? (
                                <Loader2 className="w-4 h-4 animate-spin" />
                            ) : (
                                <Sparkles className="w-4 h-4" />
                            )}
                            {isPending ? "Planning..." : "Generate Proposal"}
                        </Button>
                    </div>
                </div>
            </DialogContent>
        </Dialog>
    );
}