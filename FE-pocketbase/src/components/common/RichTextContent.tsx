/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from "react";
import { sanitizeRichHtml } from "@/lib/richText";
import { cn } from "@/lib/utils";

interface RichTextContentProps {
  html: string;
  className?: string;
}

const RichTextContent: React.FC<RichTextContentProps> = ({ html, className }) => (
  <div
    className={cn("rich-content", className)}
    dangerouslySetInnerHTML={{ __html: sanitizeRichHtml(html) }}
  />
);

export default RichTextContent;
