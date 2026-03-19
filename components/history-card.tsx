import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { MapPin, DollarSign, Calendar, ChevronRight } from "lucide-react";
import type { z } from "zod";
import type { eventRequestWithProposalSchema } from "@/app/schemas/event";

type EventRequest = z.infer<typeof eventRequestWithProposalSchema>;

export function HistoryCard({ event }: { event: EventRequest }) {
    const { proposal } = event;

    return (
        <Card className="hover:border-border transition-colors cursor-default">
            <CardContent className="p-5">
                <div className="flex items-start justify-between gap-4">
                    <div className="flex-1 min-w-0">
                        {/* User query */}
                        <p className="text-sm text-muted-foreground mb-2 line-clamp-2">
                            "{event.rawInput}"
                        </p>

                        {/* Proposal info */}
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
                                {/* Amenity badges — first 3 only */}
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
                            </div>
                        ) : (
                            <Badge variant="outline" className="text-xs text-muted-foreground">
                                No proposal generated
                            </Badge>
                        )}
                    </div>

                    <div className="flex flex-col items-end gap-2 shrink-0">
                        <span className="flex items-center gap-1 text-xs text-muted-foreground">
                            <Calendar className="w-3 h-3" />
                            {new Date(event.createdAt).toLocaleDateString("en-US", {
                                month: "short", day: "numeric",
                            })}
                        </span>
                        <ChevronRight className="w-4 h-4 text-muted-foreground" />
                    </div>
                </div>
            </CardContent>
        </Card>
    );
}