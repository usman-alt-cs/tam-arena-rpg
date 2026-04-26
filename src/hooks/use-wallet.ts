import { useEffect, useState } from "react";
import { useNavigate } from "@tanstack/react-router";
import { getWallet, subscribeWallet, type Wallet } from "@/lib/wallet-store";

export function useWallet(): Wallet | null {
  const [w, setW] = useState<Wallet | null>(() => getWallet());
  useEffect(() => {
    setW(getWallet());
    return subscribeWallet(() => setW(getWallet()));
  }, []);
  return w;
}

/** Returns a function that runs `action` if a wallet is connected,
 * otherwise routes to /connect with redirect-back + a pending action key. */
export function useRequireWallet() {
  const wallet = useWallet();
  const navigate = useNavigate();
  return function require(opts: { action?: string; redirect?: string; run?: () => void }) {
    if (wallet) {
      opts.run?.();
      return true;
    }
    const search: Record<string, string> = {};
    if (opts.redirect) search.redirect = opts.redirect;
    if (opts.action) search.action = opts.action;
    // Cast: route generated after this file is created in the same batch.
    navigate({ to: "/connect", search } as never);
    return false;
  };
}
