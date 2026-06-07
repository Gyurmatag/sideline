"use client";

import { Bot, BrainIcon, ChevronDownIcon, Sparkles } from "lucide-react";
import { useTable } from "spacetimedb/react";

import { tables } from "@/src/module_bindings";
import {
  Conversation,
  ConversationContent,
  ConversationEmptyState,
  ConversationScrollButton,
} from "@/components/ai-elements/conversation";
import { Message, MessageContent } from "@/components/ai-elements/message";
import {
  Reasoning,
  ReasoningContent,
  ReasoningTrigger,
} from "@/components/ai-elements/reasoning";
import { Task, TaskContent, TaskItem, TaskTrigger } from "@/components/ai-elements/task";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { formatProbability, initials, timeAgo } from "@/lib/format";

type FeedRow = {
  id: bigint;
  agentName: string;
  kind: string;
  reasoning: string;
  probability: number;
  ts: { toDate: () => Date };
};

export function AgentFeed({ eventSlug }: { eventSlug: string }) {
  const [feed] = useTable(tables.agent_feed.where((r) => r.eventId.eq(eventSlug)));
  const [agents] = useTable(tables.agents.where((r) => r.eventId.eq(eventSlug)));

  // Oldest -> newest so the Conversation sticks to the newest at the bottom.
  const entries = feed
    .slice()
    .sort((a, b) => (a.id < b.id ? -1 : a.id > b.id ? 1 : 0))
    .slice(-20) as unknown as FeedRow[];

  return (
    <Card>
      <CardContent className="p-6">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="flex items-center gap-2 font-semibold">
            <Sparkles className="size-4 text-indigo-500" />
            AI desk
          </h2>
          {agents.length > 0 && (
            <span className="flex items-center gap-1.5 text-xs text-muted-foreground">
              <Bot className="size-3.5" />
              {agents.length} AI agent{agents.length > 1 ? "s" : ""} live
            </span>
          )}
        </div>

        {entries.length === 0 ? (
          <ConversationEmptyState
            className="h-48"
            title="No AI activity yet"
            description="Forecaster agents post their probability, reasoning, and trades here in real time."
            icon={<Sparkles className="size-6" />}
          />
        ) : (
          <Conversation className="h-[460px]">
            <ConversationContent className="gap-6 px-1 py-0">
              {entries.map((entry, i) => (
                <FeedEntry
                  key={entry.id.toString()}
                  entry={entry}
                  latest={i === entries.length - 1}
                />
              ))}
            </ConversationContent>
            <ConversationScrollButton />
          </Conversation>
        )}
      </CardContent>
    </Card>
  );
}

function FeedEntry({ entry, latest }: { entry: FeedRow; latest: boolean }) {
  const isForecast = entry.kind === "forecast";
  const isTrade = entry.kind === "trade";

  return (
    <Message from="assistant" data-testid="agent-feed-item">
      <div className="flex items-center gap-2 text-sm">
        <span className="flex size-7 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-indigo-500 to-violet-500 text-[10px] font-semibold text-white">
          {initials(entry.agentName)}
        </span>
        <span className="font-medium">{entry.agentName}</span>
        <Badge variant="secondary" className="capitalize">
          {entry.kind}
        </Badge>
        {isForecast && (
          <Badge variant="success">{formatProbability(entry.probability)} YES</Badge>
        )}
        <span className="ml-auto text-xs text-muted-foreground">
          {timeAgo(entry.ts.toDate())}
        </span>
      </div>

      <MessageContent>
        {isForecast ? (
          <Reasoning className="mb-0" defaultOpen={latest}>
            <ReasoningTrigger className="group">
              <BrainIcon className="size-4" />
              <span>Reasoning</span>
              <ChevronDownIcon className="size-4 transition-transform group-data-[state=open]:rotate-180" />
            </ReasoningTrigger>
            <ReasoningContent>{entry.reasoning}</ReasoningContent>
          </Reasoning>
        ) : isTrade ? (
          <Task defaultOpen={latest}>
            <TaskTrigger title="Placed a trade" />
            <TaskContent>
              <TaskItem>{entry.reasoning}</TaskItem>
            </TaskContent>
          </Task>
        ) : (
          <p className="text-muted-foreground">{entry.reasoning}</p>
        )}
      </MessageContent>
    </Message>
  );
}
