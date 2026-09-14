/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from "react";
import { ArrowLeft } from "lucide-react";
import { Link } from "react-router";

interface PageHeaderProps {
  title: string;
  description?: string;
  actions?: React.ReactNode;
  backTo?: string;
  backLabel?: string;
}

const PageHeader: React.FC<PageHeaderProps> = ({
  title,
  description,
  actions,
  backTo,
  backLabel = "Back",
}) => (
  <div className="mb-8 flex flex-col gap-5 border-b pb-6 sm:flex-row sm:items-end sm:justify-between">
    <div className="min-w-0">
      {backTo && (
        <Link
          to={backTo}
          className="mb-3 inline-flex items-center gap-1.5 text-sm text-muted-foreground transition-colors hover:text-foreground"
        >
          <ArrowLeft className="size-4" />
          {backLabel}
        </Link>
      )}
      <h1 className="text-3xl font-semibold tracking-tight text-foreground">{title}</h1>
      {description && <p className="mt-2 max-w-2xl text-sm leading-6 text-muted-foreground">{description}</p>}
    </div>
    {actions && <div className="flex shrink-0 items-center gap-2">{actions}</div>}
  </div>
);

export default PageHeader;
