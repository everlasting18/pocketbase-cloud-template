/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useCallback, useEffect, useState } from "react";
import { errorMessage } from "@/lib/errors";

export interface AdminQuery<T> {
  data: T | null;
  error: string | null;
  loading: boolean;
  reload: () => void;
}

/**
 * Runs `fn` whenever `deps` change (or `reload()` is called). Results from a
 * superseded call are dropped, and previous data is kept while reloading so
 * tables don't flash empty.
 */
export function useAdminQuery<T>(fn: () => Promise<T>, deps: unknown[]): AdminQuery<T> {
  const [state, setState] = useState<Omit<AdminQuery<T>, "reload">>({
    data: null,
    error: null,
    loading: true,
  });
  const [nonce, setNonce] = useState(0);

  useEffect(() => {
    let active = true;
    setState((s) => ({ ...s, loading: true, error: null }));
    fn().then(
      (data) => {
        if (active) setState({ data, error: null, loading: false });
      },
      (err) => {
        if (active) setState((s) => ({ ...s, error: errorMessage(err), loading: false }));
      },
    );
    return () => {
      active = false;
    };
    // `fn` is recreated every render; `deps` is the caller's contract.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [...deps, nonce]);

  const reload = useCallback(() => setNonce((n) => n + 1), []);

  return { ...state, reload };
}
