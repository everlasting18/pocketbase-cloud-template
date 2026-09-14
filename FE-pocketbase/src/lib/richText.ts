/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import DOMPurify from "dompurify";

export const sanitizeRichHtml = (html: string): string =>
  DOMPurify.sanitize(html, {
    USE_PROFILES: { html: true },
  });
