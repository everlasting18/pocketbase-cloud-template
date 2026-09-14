/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from "react";
import { Check } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { cn } from "@/lib/utils";

export type StepStatus = "locked" | "pending" | "running" | "done" | "error";

const STATUS_LABEL: Record<StepStatus, string> = {
  locked: "Locked",
  pending: "To do",
  running: "Working…",
  done: "Done",
  error: "Needs attention",
};

interface StepCardProps {
  number: number;
  title: string;
  description: string;
  status: StepStatus;
  children: React.ReactNode;
}

const StepCard: React.FC<StepCardProps> = ({ number, title, description, status, children }) => (
  <Card aria-disabled={status === "locked"} className={cn(status === "locked" && "opacity-60")}>
    <CardHeader className="flex flex-row items-start gap-4 space-y-0">
      <div
        className={cn(
          "flex size-9 shrink-0 items-center justify-center rounded-full border text-sm font-semibold",
          status === "done" ? "border-primary bg-primary text-primary-foreground" : "bg-background",
        )}
      >
        {status === "done" ? <Check className="size-4" /> : number}
      </div>
      <div className="min-w-0 flex-1">
        <CardTitle>{title}</CardTitle>
        <CardDescription className="mt-1">{description}</CardDescription>
      </div>
      <Badge variant={status === "error" ? "destructive" : "outline"}>{STATUS_LABEL[status]}</Badge>
    </CardHeader>
    <CardContent>
      {status === "locked" ? (
        <p className="text-sm text-muted-foreground">Complete the previous step first.</p>
      ) : (
        children
      )}
    </CardContent>
  </Card>
);

export default StepCard;
