import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { SiteHeader } from "@/components/tam/SiteHeader";
import { TactileButton } from "@/components/tam/TactileButton";
import { Chip } from "@/components/tam/Chip";
import { StatBar } from "@/components/tam/StatBar";
import { loadListings, createListing, buyListing, cancelListing, type Listing } from "@/lib/market-store";
import { loadPets, type Pet, type Rarity, RARITY_ODDS } from "@/lib/pets-store";
import { useRequireWallet, useWallet } from "@/hooks/use-wallet";
import { shortAddr } from "@/lib/wallet-store";

export const Route = createFileRoute("/marketplace")({
  head: () => ({
    meta: [
      { title: "Marketplace — Tam Arena" },
      { name: "description", content: "Buy and sell on-chain Tams. Filter by rarity, search by name, list your own pets." },
      { property: "og:title", content: "Tam Arena Marketplace" },
      { property: "og:description", content: "Verifiable pet ownership, sub-cent gas, instant settlement on Polygon." },
    ],
  }),
  component: MarketplacePage,
});

const RARITIES: Rarity[] = ["Common", "Uncommon", "Rare", "Epic", "Legendary"];

function MarketplacePage() {
  const wallet = useWallet();
  const requireWallet = useRequireWallet();
  const [listings, setListings] = useState<Listing[]>([]);
  const [search, setSearch] = useState("");
  const [rarities, setRarities] = useState<Set<Rarity>>(new Set());
  const [maxPrice, setMaxPrice] = useState<number>(2);
  const [sort, setSort] = useState<"recent" | "price-asc" | "price-desc">("recent");
  const [showList, setShowList] = useState(false);
  const [confirm, setConfirm] = useState<Listing | null>(null);
  const [receipt, setReceipt] = useState<{ name: string; tx: string } | null>(null);

  function refresh() {
    setListings(loadListings());
  }
  useEffect(refresh, []);

  const filtered = useMemo(() => {
    let l = listings.filter((x) =>
      x.pet.name.toLowerCase().includes(search.toLowerCase()) ||
      x.pet.species.toLowerCase().includes(search.toLowerCase()),
    );
    if (rarities.size) l = l.filter((x) => rarities.has(x.pet.rarity));
    l = l.filter((x) => x.priceMatic <= maxPrice);
    if (sort === "price-asc") l.sort((a, b) => a.priceMatic - b.priceMatic);
    else if (sort === "price-desc") l.sort((a, b) => b.priceMatic - a.priceMatic);
    else l.sort((a, b) => b.listedAt - a.listedAt);
    return l;
  }, [listings, search, rarities, maxPrice, sort]);

  function toggleRarity(r: Rarity) {
    const next = new Set(rarities);
    next.has(r) ? next.delete(r) : next.add(r);
    setRarities(next);
  }

  function onBuyClick(l: Listing) {
    if (!requireWallet({ action: "buy", redirect: "/marketplace" })) return;
    setConfirm(l);
  }

  function confirmBuy() {
    if (!confirm) return;
    const res = buyListing(confirm.id);
    if (res) {
      setReceipt({ name: res.listing.pet.name, tx: res.txHash });
      refresh();
    }
    setConfirm(null);
  }

  return (
    <div className="min-h-screen bg-background text-ink">
      <SiteHeader />
      <main className="mx-auto max-w-[1280px] px-5 py-10 sm:px-8 sm:py-14">
        {/* Header */}
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div className="max-w-2xl">
            <Chip tone="primary" className="mb-3">/marketplace · floor live</Chip>
            <h1 className="font-display text-4xl sm:text-5xl tracking-tight text-balance">
              Champions on the floor.
            </h1>
            <p className="mt-3 text-muted-foreground">
              Filter by rarity, search by name, and buy verifiable pets straight to your wallet.
            </p>
          </div>
          <TactileButton
            size="md"
            onClick={() => {
              if (!requireWallet({ action: "list", redirect: "/marketplace" })) return;
              setShowList(true);
            }}
          >
            ＋ List a pet
          </TactileButton>
        </div>

        <div className="mt-8 grid gap-6 lg:grid-cols-[260px_1fr]">
          {/* Filters */}
          <aside className="space-y-4">
            <div className="rounded-2xl border-2 border-ink bg-card shadow-[var(--shadow-card)] overflow-hidden">
              <div className="border-b-2 border-ink bg-muted px-4 py-2 font-mono-ui text-[11px] uppercase">
                filters.cfg
              </div>
              <div className="p-4 space-y-5">
                <div>
                  <label className="font-mono-ui text-[10px] uppercase text-muted-foreground">search</label>
                  <input
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    placeholder="name or species…"
                    className="mt-1 w-full rounded-md border-2 border-ink bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                  />
                </div>

                <div>
                  <div className="font-mono-ui text-[10px] uppercase text-muted-foreground mb-2">rarity</div>
                  <div className="flex flex-wrap gap-1.5">
                    {RARITIES.map((r) => {
                      const on = rarities.has(r);
                      return (
                        <button
                          key={r}
                          type="button"
                          onClick={() => toggleRarity(r)}
                          className={`font-mono-ui text-[10px] uppercase border-2 border-ink rounded-md px-2 py-1 transition-colors ${on ? "bg-ink text-background" : "bg-card hover:bg-muted"}`}
                        >
                          {r}
                        </button>
                      );
                    })}
                  </div>
                </div>

                <div>
                  <div className="flex justify-between font-mono-ui text-[10px] uppercase text-muted-foreground">
                    <span>max price</span>
                    <span className="tabular-nums text-ink">◈ {maxPrice.toFixed(2)}</span>
                  </div>
                  <input
                    type="range"
                    min={0.04}
                    max={2}
                    step={0.01}
                    value={maxPrice}
                    onChange={(e) => setMaxPrice(parseFloat(e.target.value))}
                    className="mt-2 w-full accent-primary"
                  />
                </div>

                <div>
                  <div className="font-mono-ui text-[10px] uppercase text-muted-foreground mb-2">sort</div>
                  <div className="grid grid-cols-3 gap-1">
                    {([
                      ["recent", "New"],
                      ["price-asc", "$ ↑"],
                      ["price-desc", "$ ↓"],
                    ] as const).map(([k, label]) => (
                      <button
                        key={k}
                        type="button"
                        onClick={() => setSort(k)}
                        className={`font-mono-ui text-[10px] uppercase border-2 border-ink rounded-md py-1.5 ${sort === k ? "bg-primary text-primary-foreground" : "bg-card hover:bg-muted"}`}
                      >
                        {label}
                      </button>
                    ))}
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => { setSearch(""); setRarities(new Set()); setMaxPrice(2); setSort("recent"); }}
                  className="font-mono-ui text-[10px] uppercase text-muted-foreground hover:text-ink underline underline-offset-4"
                >
                  reset filters
                </button>
              </div>
            </div>

            <div className="rounded-2xl border-2 border-ink bg-ink text-background p-4">
              <div className="font-mono-ui text-[10px] uppercase opacity-70 mb-2">drop_table</div>
              <ul className="space-y-1.5">
                {RARITY_ODDS.map((o) => (
                  <li key={o.rarity} className="flex justify-between font-mono-ui text-[11px]">
                    <span>{o.rarity}</span>
                    <span className="tabular-nums opacity-70">{o.pct}%</span>
                  </li>
                ))}
              </ul>
            </div>
          </aside>

          {/* Results */}
          <section>
            <div className="flex items-center justify-between mb-4">
              <div className="font-mono-ui text-[11px] text-muted-foreground">
                {filtered.length} listing{filtered.length === 1 ? "" : "s"} · floor ◈ {(filtered[0]?.priceMatic ?? 0).toFixed(2)}
              </div>
              {wallet && (
                <Chip tone="success">● {shortAddr(wallet.address)}</Chip>
              )}
            </div>

            {filtered.length === 0 ? (
              <div className="rounded-2xl border-2 border-dashed border-ink/30 p-12 text-center">
                <p className="font-display text-2xl">No matches.</p>
                <p className="mt-2 text-muted-foreground font-mono-ui text-[12px]">Loosen a filter or list one yourself.</p>
              </div>
            ) : (
              <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-3">
                {filtered.map((l) => (
                  <ListingCard
                    key={l.id}
                    listing={l}
                    isOwn={wallet?.address === l.seller || (wallet && l.seller.startsWith(wallet.address.slice(0, 6)))}
                    onBuy={() => onBuyClick(l)}
                    onCancel={() => { cancelListing(l.id); refresh(); }}
                  />
                ))}
              </div>
            )}
          </section>
        </div>
      </main>

      {showList && wallet && (
        <ListPetModal
          onClose={() => setShowList(false)}
          onListed={() => { setShowList(false); refresh(); }}
          sellerAddress={wallet.address}
        />
      )}

      {confirm && (
        <ConfirmBuyModal listing={confirm} onCancel={() => setConfirm(null)} onConfirm={confirmBuy} />
      )}

      {receipt && (
        <ReceiptModal name={receipt.name} tx={receipt.tx} onClose={() => setReceipt(null)} />
      )}
    </div>
  );
}

/* ---------- listing card ---------- */
function ListingCard({ listing, isOwn, onBuy, onCancel }: { listing: Listing; isOwn?: boolean | null | ""; onBuy: () => void; onCancel: () => void }) {
  const p = listing.pet;
  return (
    <div className="rounded-2xl border-2 border-ink bg-card p-4 shadow-[4px_4px_0_var(--ink)] hover:shadow-[2px_2px_0_var(--ink)] hover:translate-y-[2px] transition-all">
      <div className="grid place-items-center h-40 rounded-xl border-2 border-ink bg-background grid-bg">
        <img src={p.sprite} alt={p.name} className="h-28 w-auto pixelated pixel-shadow animate-pet-idle" />
      </div>
      <div className="mt-4 flex items-start justify-between gap-2">
        <div>
          <div className="font-display text-lg leading-tight">{p.name}</div>
          <div className="font-mono-ui text-[10px] text-muted-foreground mt-0.5">
            {p.species} · {p.element}
          </div>
        </div>
        <Chip tone="primary">◈ {listing.priceMatic.toFixed(2)}</Chip>
      </div>
      <div className="mt-3 grid grid-cols-3 gap-2 font-mono-ui text-[10px]">
        <Stat k="STR" v={p.stats.str} />
        <Stat k="AGI" v={p.stats.agi} />
        <Stat k="INT" v={p.stats.int} />
      </div>
      <div className="mt-3 flex items-center justify-between font-mono-ui text-[10px] text-muted-foreground">
        <span>seller {listing.seller.slice(0, 8)}…</span>
        <Chip>{p.rarity}</Chip>
      </div>
      <div className="mt-3">
        {isOwn ? (
          <TactileButton variant="ghost" size="sm" className="w-full" onClick={onCancel}>
            Cancel listing
          </TactileButton>
        ) : (
          <TactileButton size="sm" className="w-full" onClick={onBuy}>
            Buy ◈ {listing.priceMatic.toFixed(2)}
          </TactileButton>
        )}
      </div>
    </div>
  );
}

function Stat({ k, v }: { k: string; v: number }) {
  return (
    <div className="rounded-md border border-ink/20 px-2 py-1.5 text-center">
      <div className="text-muted-foreground">{k}</div>
      <div className="font-display text-base tabular-nums">{v}</div>
    </div>
  );
}

/* ---------- list-pet modal ---------- */
function ListPetModal({ onClose, onListed, sellerAddress }: { onClose: () => void; onListed: () => void; sellerAddress: string }) {
  const owned = loadPets();
  const [petId, setPetId] = useState<string>(owned[0]?.id ?? "");
  const [price, setPrice] = useState<number>(0.1);
  const pet = owned.find((p) => p.id === petId);

  function submit() {
    if (!pet) return;
    createListing(pet, Math.max(0.01, price), sellerAddress);
    onListed();
  }

  return (
    <Modal onClose={onClose} title="List a pet for sale">
      {owned.length === 0 ? (
        <div className="text-center py-6">
          <p className="text-muted-foreground">You don't own any Tams yet.</p>
          <Link to="/hatch"><TactileButton size="md" className="mt-4">Hatch one</TactileButton></Link>
        </div>
      ) : (
        <div className="space-y-4">
          <div>
            <label className="font-mono-ui text-[10px] uppercase text-muted-foreground">pet</label>
            <select
              value={petId}
              onChange={(e) => setPetId(e.target.value)}
              className="mt-1 w-full rounded-md border-2 border-ink bg-background px-3 py-2 text-sm"
            >
              {owned.map((p) => (
                <option key={p.id} value={p.id}>{p.name} — {p.rarity}</option>
              ))}
            </select>
          </div>
          {pet && (
            <div className="flex items-center gap-3 rounded-xl border-2 border-ink bg-muted/40 p-3">
              <img src={pet.sprite} alt={pet.name} className="h-14 w-14 pixelated" />
              <div className="font-mono-ui text-[11px]">
                <div className="font-display text-base text-ink normal-case tracking-normal">{pet.name}</div>
                <div className="text-muted-foreground">STR {pet.stats.str} · AGI {pet.stats.agi} · INT {pet.stats.int}</div>
              </div>
            </div>
          )}
          <div>
            <label className="font-mono-ui text-[10px] uppercase text-muted-foreground">price (matic)</label>
            <input
              type="number"
              min={0.01}
              step={0.01}
              value={price}
              onChange={(e) => setPrice(parseFloat(e.target.value) || 0)}
              className="mt-1 w-full rounded-md border-2 border-ink bg-background px-3 py-2 text-sm tabular-nums"
            />
            <div className="font-mono-ui text-[10px] text-muted-foreground mt-1">
              ≈ ${(price * 0.74).toFixed(3)} USD · 2.5% protocol fee
            </div>
          </div>
          <div className="flex justify-end gap-2 pt-2">
            <TactileButton variant="ghost" size="md" onClick={onClose}>Cancel</TactileButton>
            <TactileButton size="md" onClick={submit}>Sign &amp; list</TactileButton>
          </div>
        </div>
      )}
    </Modal>
  );
}

/* ---------- confirm-buy modal ---------- */
function ConfirmBuyModal({ listing, onCancel, onConfirm }: { listing: Listing; onCancel: () => void; onConfirm: () => void }) {
  return (
    <Modal onClose={onCancel} title="Confirm purchase">
      <div className="flex items-center gap-3 rounded-xl border-2 border-ink bg-muted/40 p-3">
        <img src={listing.pet.sprite} alt={listing.pet.name} className="h-16 w-16 pixelated" />
        <div className="flex-1">
          <div className="font-display text-lg">{listing.pet.name}</div>
          <div className="font-mono-ui text-[11px] text-muted-foreground">{listing.pet.rarity} · {listing.pet.species}</div>
        </div>
        <Chip tone="primary">◈ {listing.priceMatic.toFixed(2)}</Chip>
      </div>
      <dl className="mt-4 space-y-1.5 font-mono-ui text-[11px]">
        <Row k="price" v={`◈ ${listing.priceMatic.toFixed(2)} MATIC`} />
        <Row k="protocol fee" v={`◈ ${(listing.priceMatic * 0.025).toFixed(4)}`} />
        <Row k="gas (est.)" v="$0.00018" />
        <Row k="total" v={`◈ ${(listing.priceMatic * 1.025).toFixed(4)}`} bold />
      </dl>
      <div className="mt-5 flex justify-end gap-2">
        <TactileButton variant="ghost" size="md" onClick={onCancel}>Cancel</TactileButton>
        <TactileButton size="md" onClick={onConfirm}>Confirm purchase</TactileButton>
      </div>
    </Modal>
  );
}

/* ---------- receipt modal ---------- */
function ReceiptModal({ name, tx, onClose }: { name: string; tx: string; onClose: () => void }) {
  const navigate = useNavigate();
  return (
    <Modal onClose={onClose} title="✓ Purchase confirmed">
      <p className="text-muted-foreground">
        <span className="text-ink font-display">{name}</span> is now in your collection.
      </p>
      <div className="mt-4 rounded-md border-2 border-ink bg-ink text-background px-3 py-3 font-mono-ui text-[11px] break-all">
        <div className="opacity-60 uppercase text-[10px]">tx hash</div>
        <div className="tabular-nums">{tx}</div>
      </div>
      <div className="mt-5 flex justify-end gap-2">
        <TactileButton variant="ghost" size="md" onClick={onClose}>Keep browsing</TactileButton>
        <TactileButton size="md" onClick={onClose}>OK</TactileButton>
      </div>
    </Modal>
  );
}

function Row({ k, v, bold }: { k: string; v: string; bold?: boolean }) {
  return (
    <div className="flex items-center justify-between border-b border-dashed border-ink/15 pb-1">
      <span className="text-muted-foreground">{k}</span>
      <span className={`tabular-nums ${bold ? "font-display text-base" : ""}`}>{v}</span>
    </div>
  );
}

/* ---------- generic modal ---------- */
function Modal({ children, onClose, title }: { children: React.ReactNode; onClose: () => void; title: string }) {
  return (
    <div className="fixed inset-0 z-50 grid place-items-center px-4 bg-ink/60 backdrop-blur-sm" onClick={onClose}>
      <div
        className="w-full max-w-md rounded-2xl border-2 border-ink bg-card shadow-[8px_8px_0_var(--ink)] overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between border-b-2 border-ink bg-muted px-5 py-3">
          <span className="font-display text-lg">{title}</span>
          <button onClick={onClose} className="font-mono-ui text-[11px] text-muted-foreground hover:text-ink">esc</button>
        </div>
        <div className="p-5">{children}</div>
      </div>
    </div>
  );
}
