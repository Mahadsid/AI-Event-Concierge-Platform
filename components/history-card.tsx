"use client";

import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
    MapPin, DollarSign, Calendar,
    ChevronDown, CheckCircle2, Sparkles,
} from "lucide-react";
import type { z } from "zod";
import type { eventRequestWithProposalSchema } from "@/app/schemas/event";

type EventRequest = z.infer<typeof eventRequestWithProposalSchema>;

export function HistoryCard({ event }: { event: EventRequest }) {
    const [expanded, setExpanded] = useState(false);
    const { proposal } = event;

    return (
        <Card
            className="hover:border-border/80 transition-all duration-200 cursor-pointer"
            onClick={() => setExpanded((prev) => !prev)}
        >
            <CardContent className="p-5">
                {/* ── Collapsed row (always visible) ── */}
                <div className="flex items-start justify-between gap-4">
                    <div className="flex-1 min-w-0">
                        <p className="text-sm text-muted-foreground mb-2 line-clamp-2">
                            "{event.rawInput}"
                        </p>

                        {proposal ? (
                            <div className="space-y-1.5">
                                <p className="font-semibold truncate">{proposal.venueName}</p>
                                <div className="flex flex-wrap items-center gap-3 text-sm text-muted-foreground">
                                    <span className="flex items-center gap-1">
                                        <MapPin className="w-3.5 h-3.5" />
                                        {proposal.location}
                                    </span>
                                    <span className="flex items-center gap-1">
                                        <DollarSign className="w-3.5 h-3.5" />
                                        {proposal.estimatedCost}
                                    </span>
                                </div>
                                {/* Amenity badges — collapsed: first 3 only */}
                                {!expanded && (
                                    <div className="flex flex-wrap gap-1.5 pt-1">
                                        {proposal.amenities.slice(0, 3).map((a) => (
                                            <Badge key={a} variant="secondary" className="text-xs font-normal">
                                                {a}
                                            </Badge>
                                        ))}
                                        {proposal.amenities.length > 3 && (
                                            <Badge variant="outline" className="text-xs font-normal text-muted-foreground">
                                                +{proposal.amenities.length - 3} more
                                            </Badge>
                                        )}
                                    </div>
                                )}
                            </div>
                        ) : (
                            <Badge variant="outline" className="text-xs text-muted-foreground">
                                No proposal generated
                            </Badge>
                        )}
                    </div>

                    {/* Right side — date + chevron */}
                    <div className="flex flex-col items-end gap-2 shrink-0">
                        <span className="flex items-center gap-1 text-xs text-muted-foreground">
                            <Calendar className="w-3 h-3" />
                            {new Date(event.createdAt).toLocaleDateString("en-US", {
                                month: "short",
                                day: "numeric",
                            })}
                        </span>
                        <ChevronDown
                            className={`w-4 h-4 text-muted-foreground transition-transform duration-300 ${expanded ? "rotate-180" : ""
                                }`}
                        />
                    </div>
                </div>

                {/* ── Expanded details ── */}
                {expanded && proposal && (
                    <div className="mt-5 space-y-5 border-t border-border/50 pt-5">
                        {/* User request */}
                        <div className="flex items-start gap-3 p-3 rounded-lg bg-muted/30">
                            <div className="w-6 h-6 rounded-full bg-primary/10 flex items-center justify-center shrink-0 mt-0.5">
                                <Sparkles className="w-3 h-3 text-primary" />
                            </div>
                            <div>
                                <p className="text-xs text-muted-foreground mb-0.5">Your request</p>
                                <p className="text-sm">{event.rawInput}</p>
                            </div>
                        </div>

                        {/* Gradient accent bar */}
                        <div className="h-1 rounded-full bg-gradient-to-r from-primary via-primary/60 to-primary/20" />

                        {/* Why it fits */}
                        <div>
                            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">
                                Why it fits
                            </p>
                            <p className="text-sm leading-relaxed text-foreground/90">
                                {proposal.whyItFits}
                            </p>
                        </div>

                        {/* All amenities */}
                        <div>
                            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3">
                                Amenities included
                            </p>
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                                {proposal.amenities.map((amenity) => (
                                    <div key={amenity} className="flex items-center gap-2">
                                        <CheckCircle2 className="w-3.5 h-3.5 text-primary shrink-0" />
                                        <span className="text-sm text-foreground/80">{amenity}</span>
                                    </div>
                                ))}
                            </div>
                        </div>

                        {/* Footer date */}
                        <div className="flex items-center gap-1.5 text-muted-foreground pt-1 border-t border-border/50">
                            <Calendar className="w-3.5 h-3.5" />
                            <span className="text-xs">
                                Generated{" "}
                                {new Date(event.createdAt).toLocaleDateString("en-US", {
                                    month: "long",
                                    day: "numeric",
                                    year: "numeric",
                                })}
                            </span>
                        </div>
                    </div>
                )}
            </CardContent>
        </Card>
    );
}