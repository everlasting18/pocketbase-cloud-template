/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useEffect, useState } from "react";
import { AlertCircle, CheckCircle2 } from "lucide-react";
import { toast } from "sonner";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Field, FieldLabel } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import {
  getCurrentPocketBaseUrl,
  isMockPocketBaseEnabled,
  setPocketBaseUrl,
  testPocketBaseConnection,
} from "@/services/pocketbase";

interface TestResult {
  connected: boolean;
  message: string;
}

const ConnectionCard: React.FC = () => {
  const [url, setUrl] = useState(getCurrentPocketBaseUrl);
  const [testing, setTesting] = useState(false);
  const [result, setResult] = useState<TestResult | null>(null);

  const runTest = async (target: string) => {
    setTesting(true);
    const r = await testPocketBaseConnection(target);
    setTesting(false);
    setResult({
      connected: r.connected,
      message: r.message || (r.connected ? "Server healthy" : "Connection failed"),
    });
  };

  // Check the saved instance once when the page opens.
  useEffect(() => {
    runTest(getCurrentPocketBaseUrl());
  }, []);

  const apply = async () => {
    setPocketBaseUrl(url);
    toast.success("PocketBase URL saved in this browser");
    await runTest(url);
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Connection</CardTitle>
        <CardDescription>
          PocketBase instance used by the store and this admin. Saved in this browser; defaults to{" "}
          <code className="font-mono">VITE_POCKETBASE_URL</code>.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {isMockPocketBaseEnabled && (
          <Alert>
            <CheckCircle2 />
            <AlertTitle>Development mock active</AlertTitle>
            <AlertDescription>
              Products, articles, and orders are stored only in this browser. No PocketBase
              server is contacted.
            </AlertDescription>
          </Alert>
        )}
        <Field>
          <FieldLabel htmlFor="pb-url">Instance URL</FieldLabel>
          <div className="flex flex-col gap-2 sm:flex-row">
            <Input
              id="pb-url"
              type="url"
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              placeholder="https://your-instance.pocketbasecloud.com"
              className="font-mono"
            />
            <Button variant="outline" onClick={() => runTest(url)} disabled={testing}>
              {testing ? "Testing…" : "Test"}
            </Button>
            <Button onClick={apply} disabled={testing}>
              Save & apply
            </Button>
          </div>
        </Field>
        {result && (
          <Alert variant={result.connected ? "default" : "destructive"}>
            {result.connected ? <CheckCircle2 /> : <AlertCircle />}
            <AlertTitle>{result.connected ? "Connected" : "Can't reach PocketBase"}</AlertTitle>
            <AlertDescription>{result.message}</AlertDescription>
          </Alert>
        )}
      </CardContent>
    </Card>
  );
};

export default ConnectionCard;
