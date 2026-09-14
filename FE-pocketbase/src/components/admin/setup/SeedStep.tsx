/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from "react";
import type PocketBase from "pocketbase";
import { AlertCircle, CheckCircle2 } from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { switchDataSource } from "@/services/pocketbase";
import {
  type SeedProgress,
  type SeedResult,
  describeSetupError,
  seedSampleData,
} from "@/setup/setupApi";

interface SeedStepProps {
  client: PocketBase;
  url: string;
  onStatusChange: (status: "running" | "done" | "error") => void;
}

const LABEL: Record<SeedProgress["collection"], string> = {
  products: "Products",
  journal_articles: "Articles",
};

const SeedStep: React.FC<SeedStepProps> = ({ client, url, onStatusChange }) => {
  const [running, setRunning] = useState(false);
  const [progress, setProgress] = useState<Partial<Record<SeedProgress["collection"], SeedProgress>>>({});
  const [result, setResult] = useState<SeedResult | null>(null);
  const [error, setError] = useState<string | null>(null);

  const seed = async () => {
    setRunning(true);
    setError(null);
    setResult(null);
    onStatusChange("running");
    try {
      const r = await seedSampleData(client, (p) => setProgress((prev) => ({ ...prev, [p.collection]: p })));
      setResult(r);
      onStatusChange(r.failed.length ? "error" : "done");
    } catch (err) {
      setError(describeSetupError(err, "seed"));
      onStatusChange("error");
    } finally {
      setRunning(false);
    }
  };

  const progressText = Object.values(progress)
    .map((p) => `${LABEL[p!.collection]} ${p!.done}/${p!.total}`)
    .join(" · ");

  return (
    <div className="space-y-4">
      <p className="text-sm text-muted-foreground">
        Adds the demo catalog (6 products, 3 journal articles). Records that already exist are skipped, so it is
        safe to run again.
      </p>
      <div className="flex flex-wrap items-center gap-3">
        <Button onClick={seed} disabled={running}>
          {running ? "Seeding…" : result ? "Seed again" : "Seed sample data"}
        </Button>
        {progressText && <span className="font-mono text-xs text-muted-foreground">{progressText}</span>}
      </div>

      {result && result.failed.length === 0 && (
        <Alert>
          <CheckCircle2 />
          <AlertTitle>Sample data ready</AlertTitle>
          <AlertDescription>
            <p>Created {result.created}, skipped {result.skipped} existing.</p>
            <Button className="mt-3" onClick={() => switchDataSource("remote", url)}>
              Switch this browser to PocketBase
            </Button>
          </AlertDescription>
        </Alert>
      )}
      {result && result.failed.length > 0 && (
        <Alert variant="destructive">
          <AlertCircle />
          <AlertTitle>Seeded {result.created}, failed {result.failed.length}</AlertTitle>
          <AlertDescription>
            <ul className="list-disc pl-5">
              {result.failed.map((f) => (
                <li key={`${f.collection}:${f.label}`}>
                  <span className="font-mono">{f.label}</span>: {f.message}
                </li>
              ))}
            </ul>
          </AlertDescription>
        </Alert>
      )}
      {error && (
        <Alert variant="destructive">
          <AlertCircle />
          <AlertTitle>Seeding failed</AlertTitle>
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}
    </div>
  );
};

export default SeedStep;
