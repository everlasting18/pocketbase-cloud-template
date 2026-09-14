/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from "react";
import { AlertCircle } from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";

interface DataStateProps {
  loading: boolean;
  error: string | null;
  onRetry: () => void;
  rows?: number;
}

/** Loading skeleton or load-error alert; renders nothing once data is ready. */
const DataState: React.FC<DataStateProps> = ({ loading, error, onRetry, rows = 5 }) => {
  if (error) {
    return (
      <Alert variant="destructive">
        <AlertCircle />
        <AlertTitle>Couldn't load data from PocketBase</AlertTitle>
        <AlertDescription>
          <p>{error}</p>
          <Button variant="outline" size="sm" className="mt-2" onClick={onRetry}>
            Retry
          </Button>
        </AlertDescription>
      </Alert>
    );
  }

  if (loading) {
    return (
      <div className="space-y-2" aria-busy="true">
        {Array.from({ length: rows }, (_, i) => (
          <Skeleton key={i} className="h-10 w-full" />
        ))}
      </div>
    );
  }

  return null;
};

export default DataState;
