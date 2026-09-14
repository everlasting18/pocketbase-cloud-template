/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from "react";
import type PocketBase from "pocketbase";
import { AlertCircle, TriangleAlert } from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Field, FieldLabel } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { checkHealth, createSetupClient, describeSetupError, isInsecureUrl } from "@/setup/setupApi";

interface ConnectStepProps {
  url: string;
  connected: boolean;
  onUrlChange: (url: string) => void;
  onConnected: (client: PocketBase) => void;
}

const ConnectStep: React.FC<ConnectStepProps> = ({ url, connected, onUrlChange, onConnected }) => {
  const [testing, setTesting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const test = async (event: React.FormEvent) => {
    event.preventDefault();
    setTesting(true);
    setError(null);
    const client = createSetupClient(url);
    try {
      await checkHealth(client);
      onConnected(client);
    } catch (err) {
      setError(describeSetupError(err, "connect"));
    } finally {
      setTesting(false);
    }
  };

  return (
    <form onSubmit={test} className="space-y-4">
      <ol className="list-decimal space-y-1 pl-5 text-sm text-muted-foreground">
        <li>
          Create an instance in the PocketBase Cloud dashboard, or run{" "}
          <code className="font-mono">pbc pocketbase deploy</code> in <code className="font-mono">BE-pocketbase</code>.
        </li>
        <li>Copy its base URL (the API base URL without <code className="font-mono">/api/</code>).</li>
      </ol>
      <Field>
        <FieldLabel htmlFor="setup-url">Instance URL</FieldLabel>
        <div className="flex flex-col gap-2 sm:flex-row">
          <Input
            id="setup-url"
            type="url"
            required
            value={url}
            onChange={(e) => onUrlChange(e.target.value)}
            placeholder="https://your-instance.pocketbasecloud.com"
            className="font-mono"
          />
          <Button type="submit" disabled={testing || !url.trim()}>
            {testing ? "Testing…" : connected ? "Test again" : "Test connection"}
          </Button>
        </div>
      </Field>
      {isInsecureUrl(url) && (
        <Alert>
          <TriangleAlert />
          <AlertTitle>Not HTTPS</AlertTitle>
          <AlertDescription>Your superuser password would travel unencrypted. Use an https:// URL.</AlertDescription>
        </Alert>
      )}
      {error && (
        <Alert variant="destructive">
          <AlertCircle />
          <AlertTitle>Connection failed</AlertTitle>
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}
    </form>
  );
};

export default ConnectStep;
