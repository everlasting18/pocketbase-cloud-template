/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from "react";
import CollectionMapping from "@/components/admin/CollectionMapping";
import ConnectionCard from "@/components/admin/ConnectionCard";
import PageHeader from "@/components/admin/PageHeader";

const SettingsPage: React.FC = () => (
  <>
    <PageHeader
      title="Settings"
      description="PocketBase connection and how the app's models map to collections."
    />
    <div className="grid max-w-6xl gap-6">
      <ConnectionCard />
      <CollectionMapping />
    </div>
  </>
);

export default SettingsPage;
