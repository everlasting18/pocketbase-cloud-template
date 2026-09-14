/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from "react";
import { Link } from "react-router";
import { Button } from "@/components/ui/button";

interface FormActionsProps {
  submitLabel: string;
  cancelTo: string;
  isSubmitting: boolean;
}

const FormActions: React.FC<FormActionsProps> = ({
  submitLabel,
  cancelTo,
  isSubmitting,
}) => (
  <div className="sticky bottom-3 z-20 mt-6 flex justify-stretch sm:justify-end">
    <div className="grid w-full grid-cols-2 gap-2 rounded-xl border bg-background/95 p-2 shadow-lg shadow-black/10 backdrop-blur sm:w-auto sm:min-w-72 sm:flex">
      <Button type="button" variant="outline" size="lg" className="sm:min-w-32" asChild>
        <Link to={cancelTo}>Cancel</Link>
      </Button>
      <Button type="submit" size="lg" className="sm:min-w-36" disabled={isSubmitting}>
        {isSubmitting ? "Saving…" : submitLabel}
      </Button>
    </div>
  </div>
);

export default FormActions;
