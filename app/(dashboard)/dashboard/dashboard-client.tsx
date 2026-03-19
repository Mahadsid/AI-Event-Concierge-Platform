"use client";

import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Plus, Sparkles, History, LayoutDashboard } from "lucide-react";
import { toast } from "sonner";
import { orpc } from "@/lib/orpc";
import { NewEventModal } from "@/components/new-event-modal";
import { ProposalCard } from "@/components/proposal-card";
import { HistoryCard } from "@/components/history-card";
import type { z } from "zod";
import type { eventRequestWithProposalSchema } from "@/app/schemas/event";

type EventRequest = z.infer<typeof eventRequestWithProposalSchema>;

interface DashboardClientProps {
    initialEvents: EventRequest[];
}

export function DashboardClient({ initialEvents }: DashboardClientProps) {
    const [modalOpen, setModalOpen] = useState(false);
    const [activeTab, setActiveTab] = useState("dashboard");
    const queryClient = useQueryClient();

    // oRPC TanStack Query — .queryOptions()
    const { data: events = initialEvents } = useQuery({
        ...orpc.event.list.queryOptions(),
        initialData: { events: initialEvents }, // seed with SSR data
        select: (data) => data.events,          // unwrap the { events: [...] } shape
    });

    const latestEvent = events[0] ?? null;

    //  mutation  — .mutationOptions()
    const { mutate: generateProposal, isPending } = useMutation({
        ...orpc.ai.generateProposal.mutationOptions(),
        onSuccess: (newEvent) => {
            // Invalidate event list so it refetches with the new entry
            queryClient.invalidateQueries({
                queryKey: orpc.event.list.key(),
            });
            toast.success("Venue proposal ready!", {
                description: newEvent.proposal?.venueName,
            });
            setModalOpen(false);
            setActiveTab("dashboard");
        },
        onError: (err: any) => {
            toast.error("Something went wrong", {
                description: err?.message ?? "Could not generate proposal.",
            });
        },
    });

    return (
        <div className="max-w-5xl mx-auto px-6 py-8">
            {/* Header row */}
            <div className="flex items-center justify-between mb-8">
                <div>
                    <h1 className="text-2xl font-bold tracking-tight">Event Concierge</h1>
                    <p className="text-muted-foreground text-sm mt-1">
                        AI-powered venue recommendations for your corporate events
                    </p>
                </div>
                <Button onClick={() => setModalOpen(true)} className="gap-2">
                    <Plus className="w-4 h-4" />
                    New Event
                </Button>
            </div>

            <Tabs value={activeTab} onValueChange={setActiveTab}>
                <TabsList className="mb-6">
                    <TabsTrigger value="dashboard" className="gap-2">
                        <LayoutDashboard className="w-4 h-4" />
                        Dashboard
                    </TabsTrigger>
                    <TabsTrigger value="history" className="gap-2">
                        <History className="w-4 h-4" />
                        History
                        {events.length > 0 && (
                            <span className="ml-1 text-xs bg-muted text-muted-foreground rounded-full px-1.5 py-0.5">
                                {events.length}
                            </span>
                        )}
                    </TabsTrigger>
                </TabsList>

                {/* DASHBOARD TAB */}
                <TabsContent value="dashboard">
                    {latestEvent?.proposal ? (
                        <ProposalCard event={latestEvent} />
                    ) : (
                        <EmptyState onOpen={() => setModalOpen(true)} />
                    )}
                </TabsContent>

                {/* HISTORY TAB */}
                <TabsContent value="history">
                    {events.length === 0 ? (
                        <EmptyState onOpen={() => setModalOpen(true)} />
                    ) : (
                        <div className="grid gap-4">
                            {events.map((event: EventRequest) => (
                                <HistoryCard key={event.id} event={event} />
                            ))}
                        </div>
                    )}
                </TabsContent>
            </Tabs>

            <NewEventModal
                open={modalOpen}
                onOpenChange={setModalOpen}
                onSubmit={(rawInput) => generateProposal({ rawInput })}
                isPending={isPending}
            />
        </div>
    );
}

function EmptyState({ onOpen }: { onOpen: () => void }) {
    return (
        <div className="flex flex-col items-center justify-center py-24 text-center border border-dashed border-border rounded-xl">
            <div className="w-12 h-12 rounded-full bg-muted flex items-center justify-center mb-4">
                <Sparkles className="w-5 h-5 text-muted-foreground" />
            </div>
            <h3 className="font-semibold mb-1">No proposals yet</h3>
            <p className="text-sm text-muted-foreground mb-4 max-w-xs">
                Describe your event and our AI will find the perfect venue for you.
            </p>
            <Button onClick={onOpen} variant="outline" className="gap-2">
                <Plus className="w-4 h-4" />
                Plan your first event
            </Button>
        </div>
    );
}