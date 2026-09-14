/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useEffect, useRef, useState } from "react";
import type PocketBase from "pocketbase";
import { ArrowLeft } from "lucide-react";
import { Link } from "react-router";
import CollectionsStep from "@/components/admin/setup/CollectionsStep";
import ConnectStep from "@/components/admin/setup/ConnectStep";
import SeedStep from "@/components/admin/setup/SeedStep";
import StepCard, { type StepStatus } from "@/components/admin/setup/StepCard";
import { getCurrentPocketBaseUrl, isMockMode } from "@/services/pocketbase";
import { normalizeUrl } from "@/setup/setupApi";

const initialUrl = (): string => {
  const saved = getCurrentPocketBaseUrl();
  return saved.includes("your-instance") ? "" : saved;
};

const SetupPage: React.FC = () => {
  const [url, setUrl] = useState(initialUrl);
  const [client, setClient] = useState<PocketBase | null>(null);
  const [collectionsStatus, setCollectionsStatus] = useState<StepStatus>("pending");
  const [seedStatus, setSeedStatus] = useState<StepStatus>("pending");
  const clientRef = useRef<PocketBase | null>(null);
  clientRef.current = client;

  // Drop the in-memory superuser session when leaving the page.
  useEffect(() => () => clientRef.current?.authStore.clear(), []);

  const changeUrl = (next: string) => {
    setUrl(next);
    // A different server invalidates everything done against the old one.
    client?.authStore.clear();
    setClient(null);
    setCollectionsStatus("pending");
    setSeedStatus("pending");
  };

  const collectionsReady = collectionsStatus === "done";

  return (
    <div className="min-h-svh bg-muted/40 px-4 py-10">
      <div className="mx-auto w-full max-w-3xl space-y-6">
        <Link
          to={isMockMode() ? "/admin/login" : "/admin/products"}
          className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground"
        >
          <ArrowLeft className="size-4" /> Back to admin
        </Link>
        <div>
          <h1 className="text-3xl font-semibold tracking-tight">Set up PocketBase</h1>
          <p className="mt-2 text-sm leading-6 text-muted-foreground">
            Connect this store to your own PocketBase instance in three steps.
            {isMockMode() && " Until you switch, this browser keeps using demo data."}
          </p>
        </div>

        <StepCard
          number={1}
          title="Connect"
          description="Point the store at your PocketBase instance."
          status={client ? "done" : "pending"}
        >
          <ConnectStep url={url} connected={client !== null} onUrlChange={changeUrl} onConnected={setClient} />
        </StepCard>

        <StepCard
          number={2}
          title="Collections"
          description="Create products, journal_articles and orders."
          status={client ? collectionsStatus : "locked"}
        >
          {client && (
            <CollectionsStep
              client={client}
              dashboardUrl={normalizeUrl(url)}
              ready={collectionsReady}
              onReady={() => setCollectionsStatus("done")}
              onStatusChange={setCollectionsStatus}
            />
          )}
        </StepCard>

        <StepCard
          number={3}
          title="Sample data"
          description="Seed the demo catalog, then switch this browser over."
          status={client && collectionsReady ? seedStatus : "locked"}
        >
          {client && collectionsReady && (
            <SeedStep client={client} url={normalizeUrl(url)} onStatusChange={setSeedStatus} />
          )}
        </StepCard>
      </div>
    </div>
  );
};

export default SetupPage;
