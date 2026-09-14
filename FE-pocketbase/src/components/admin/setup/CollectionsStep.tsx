/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from "react";
import type PocketBase from "pocketbase";
import { AlertCircle, CheckCircle2, Copy } from "lucide-react";
import { toast } from "sonner";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Field, FieldGroup, FieldLabel } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { Separator } from "@/components/ui/separator";
import {
  COLLECTIONS_JSON,
  authSuperuser,
  describeSetupError,
  findMissingCollections,
  importCollections,
} from "@/setup/setupApi";

interface CollectionsStepProps {
  client: PocketBase;
  dashboardUrl: string;
  ready: boolean;
  onReady: () => void;
  onStatusChange: (status: "running" | "error" | "pending") => void;
}

const CollectionsStep: React.FC<CollectionsStepProps> = ({ client, dashboardUrl, ready, onReady, onStatusChange }) => {
  // Kept in component state only; never persisted.
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState<"import" | "check" | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [missing, setMissing] = useState<string[] | null>(null);

  const run = async (action: "import" | "check") => {
    setBusy(action);
    setError(null);
    onStatusChange("running");
    // Track which call failed so the message fits (auth vs import/check).
    let stage: "auth" | "import" | "check" = "auth";
    try {
      if (!client.authStore.isValid) await authSuperuser(client, email, password);
      stage = action;
      if (action === "import") await importCollections(client);
      const stillMissing = await findMissingCollections(client);
      setMissing(stillMissing);
      if (stillMissing.length === 0) {
        onReady();
      } else {
        onStatusChange("pending");
      }
    } catch (err) {
      setError(describeSetupError(err, stage));
      onStatusChange("error");
    } finally {
      setBusy(null);
    }
  };

  const copyJson = async () => {
    try {
      await navigator.clipboard.writeText(COLLECTIONS_JSON);
      toast.success("Collections JSON copied");
    } catch {
      toast.error("Clipboard is blocked in this browser");
    }
  };

  const signedIn = client.authStore.isValid;

  return (
    <div className="space-y-5">
      <FieldGroup className="grid gap-3 sm:grid-cols-2">
        <Field>
          <FieldLabel htmlFor="setup-email">Superuser email</FieldLabel>
          <Input id="setup-email" type="email" autoComplete="username" value={email} disabled={signedIn}
            onChange={(e) => setEmail(e.target.value)} />
        </Field>
        <Field>
          <FieldLabel htmlFor="setup-password">Superuser password</FieldLabel>
          <Input id="setup-password" type="password" autoComplete="current-password" value={password} disabled={signedIn}
            onChange={(e) => setPassword(e.target.value)} />
        </Field>
      </FieldGroup>
      <p className="text-xs text-muted-foreground">
        Credentials go directly from your browser to your instance. Nothing is stored.
        {" "}Find them with <code className="font-mono">pbc pocketbase info</code>.
      </p>

      <div className="flex flex-wrap gap-2">
        <Button onClick={() => run("import")} disabled={busy !== null || (!signedIn && (!email || !password))}>
          {busy === "import" ? "Importing…" : "Import automatically"}
        </Button>
        <Button variant="outline" onClick={() => run("check")} disabled={busy !== null || (!signedIn && (!email || !password))}>
          {busy === "check" ? "Checking…" : "Check collections"}
        </Button>
      </div>

      <Separator />

      <div className="space-y-2 text-sm">
        <p className="font-medium">Prefer to import by hand?</p>
        <ol className="list-decimal space-y-1 pl-5 text-muted-foreground">
          <li>Copy the collections JSON.</li>
          <li>
            Open your{" "}
            <a className="underline" href={`${dashboardUrl}/_/`} target="_blank" rel="noreferrer">dashboard</a>
            {" "}→ Settings → Import collections.
          </li>
          <li>Paste, review the changes, confirm. Then press “Check collections”.</li>
        </ol>
        <Button variant="outline" size="sm" onClick={copyJson}>
          <Copy /> Copy JSON
        </Button>
      </div>

      {missing && missing.length > 0 && (
        <Alert>
          <AlertCircle />
          <AlertTitle>Missing collections</AlertTitle>
          <AlertDescription className="font-mono">{missing.join(", ")}</AlertDescription>
        </Alert>
      )}
      {ready && (
        <Alert>
          <CheckCircle2 />
          <AlertTitle>Collections ready</AlertTitle>
          <AlertDescription>products, journal_articles and orders exist.</AlertDescription>
        </Alert>
      )}
      {error && (
        <Alert variant="destructive">
          <AlertCircle />
          <AlertTitle>That didn't work</AlertTitle>
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}
    </div>
  );
};

export default CollectionsStep;
