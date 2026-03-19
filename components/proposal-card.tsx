import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { MapPin, DollarSign, Sparkles, CheckCircle2, Calendar } from "lucide-react";
import type { z } from "zod";
import type { eventRequestWithProposalSchema } from "@/app/schemas/event";

type EventRequest = z.infer<typeof eventRequestWithProposalSchema>;

export function ProposalCard({ event }: { event: EventRequest }) {
    const { proposal } = event;
    if (!proposal) return null;

    return (
        <div className="space-y-4">
            {/* User's original request */}
            <div className="flex items-start gap-3 p-4 rounded-lg bg-muted/30 border border-border/50">
                <div className="w-7 h-7 rounded-full bg-primary/10 flex items-center justify-center shrink-0 mt-0.5">
                    <Sparkles className="w-3.5 h-3.5 text-primary" />
                </div>
                <div>
                    <p className="text-xs text-muted-foreground mb-1">Your Request</p>
                    <p className="text-sm">{event.rawInput}</p>
                </div>
            </div>

            {/* Main proposal card */}
            <Card className="overflow-hidden border-border/50">
                <div className="h-1.5 bg-gradient-to-r from-primary via-primary/70 to-primary/30" />
                <CardHeader className="pb-3">
                    <div className="flex items-start justify-between gap-4">
                        <div>
                            <Badge variant="secondary" className="mb-2 text-xs">
                                AI Recommendation
                            </Badge>
                            <h2 className="text-xl font-bold">{proposal.venueName}</h2>
                            <div className="flex items-center gap-1.5 mt-1.5 text-muted-foreground">
                                <MapPin className="w-3.5 h-3.5" />
                                <span className="text-sm">{proposal.location}</span>
                            </div>
                        </div>
                        <div className="text-right shrink-0">
                            <div className="flex items-center gap-1 text-muted-foreground justify-end">
                                <DollarSign className="w-3.5 h-3.5" />
                                <span className="text-xs">Estimated Cost</span>
                            </div>
                            <p className="text-lg font-semibold text-foreground mt-0.5">
                                {proposal.estimatedCost}
                            </p>
                        </div>
                    </div>
                </CardHeader>

                <CardContent className="space-y-5">
                    {/* Why it fits */}
                    <div>
                        <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">
                            Why it fits
                        </h3>
                        <p className="text-sm leading-relaxed text-foreground/90">
                            {proposal.whyItFits}
                        </p>
                    </div>

                    {/* Amenities */}
                    <div>
                        <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3">
                            Amenities included
                        </h3>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                            {proposal.amenities.map((amenity) => (
                                <div key={amenity} className="flex items-center gap-2">
                                    <CheckCircle2 className="w-3.5 h-3.5 text-primary shrink-0" />
                                    <span className="text-sm text-foreground/80">{amenity}</span>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Footer */}
                    <div className="flex items-center gap-1.5 text-muted-foreground pt-2 border-t border-border/50">
                        <Calendar className="w-3.5 h-3.5" />
                        <span className="text-xs">
                            Generated {new Date(event.createdAt).toLocaleDateString("en-US", {
                                month: "long", day: "numeric", year: "numeric",
                            })}
                        </span>
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}