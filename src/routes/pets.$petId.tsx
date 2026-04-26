import { createFileRoute, Link, useParams } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { SiteHeader } from "@/components/tam/SiteHeader";
import { TactileButton } from "@/components/tam/TactileButton";
import { Chip } from "@/components/tam/Chip";
import { StatBar } from "@/components/tam/StatBar";
import { getPet, type Pet } from "@/lib/pets-store";

export const Route = createFileRoute("/pets/$petId")({
  head: ({ params }) => ({
    meta: [
      { title: `Pet ${params.petId} — Tam Arena` },
      { name: "description", content: "Tam Arena pet profile, stats and battle history." },
    ],
  }),
  component: PetProfile,
  notFoundComponent: () => (
    <div className="min-h-screen bg-background text-ink">
      <SiteHeader />
      <main className="mx-auto max-w-xl px-6 py-24 text-center">
        <h1 className="font-display text-4xl">No such Tam</h1>
        <p className="mt-3 text-muted-foreground">
          That pet was never minted on this device. Try hatching one.
        </p>
        <div className="mt-6 flex justify-center gap-3">
          <Link to="/hatch"><TactileButton>Hatch a pet</TactileButton></Link>
          <Link to="/"><TactileButton variant="ghost">Home</TactileButton></Link>
        </div>
      </main>
    </div>
  ),
  errorComponent: ({ error }) => (
    <div className="p-10 font-mono-ui text-sm">Error loading pet: {error.message}</div>
  ),
});

function PetProfile() {
  const { petId } = useParams({ from: "/pets/$petId" });
  const [pet, setPet] = useState<Pet | null | undefined>(undefined);

  useEffect(() => {
    setPet(getPet(petId) ?? null);
  }, [petId]);

  if (pet === undefined) {
    return (
      <div className="min-h-screen bg-background text-ink">
        <SiteHeader />
        <main className="mx-auto max-w-3xl px-6 py-16 font-mono-ui text-sm text-muted-foreground">
          Loading pet…
        </main>
      </div>
    );
  }

  if (pet === null) {
    return (
      <div className="min-h-screen bg-background text-ink">
        <SiteHeader />
        <main className="mx-auto max-w-xl px-6 py-24 text-center">
          <h1 className="font-display text-4xl">Pet not found</h1>
          <p className="mt-3 text-muted-foreground font-mono-ui text-[12px]">id: {petId}</p>
          <div className="mt-6 flex justify-center gap-3">
            <Link to="/hatch"><TactileButton>Hatch a new pet</TactileButton></Link>
            <Link to="/"><TactileButton variant="ghost">Home</TactileButton></Link>
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background text-ink">
      <SiteHeader />
      <main className="mx-auto max-w-[1200px] px-5 py-10 sm:px-8 sm:py-14">
        <Link to="/hatch" className="font-mono-ui text-[12px] text-muted-foreground hover:text-ink">
          ← back to hatchery
        </Link>

        <div className="mt-6 grid gap-8 lg:grid-cols-[0.9fr_1.1fr]">
          {/* Portrait */}
          <section className="rounded-2xl border-2 border-ink bg-card shadow-[var(--shadow-card)] overflow-hidden">
            <div className="flex items-center justify-between border-b-2 border-ink bg-muted px-5 py-2.5">
              <span className="font-mono-ui text-[11px] uppercase tracking-wider">tam #{pet.id.slice(-4)}</span>
              <span className="font-mono-ui text-[11px] text-success">● alive</span>
            </div>
            <div className="grid place-items-center bg-[radial-gradient(ellipse_at_center,_var(--muted)_0%,_var(--background)_70%)] py-12">
              <img src={pet.sprite} alt={pet.name} className="h-64 w-64 object-contain animate-pet-idle" />
            </div>
            <div className="border-t-2 border-ink px-5 py-4 flex flex-wrap items-center gap-2">
              <Chip>{pet.rarity}</Chip>
              <Chip>{pet.element}</Chip>
              <Chip>{pet.species}</Chip>
            </div>
          </section>

          {/* Stats + actions */}
          <section className="space-y-6">
            <div>
              <h1 className="font-display text-4xl sm:text-5xl tracking-tight">{pet.name}</h1>
              <p className="mt-2 font-mono-ui text-[12px] text-muted-foreground">
                hatched {new Date(pet.hatchedAt).toLocaleString()} · tx {pet.txHash}
              </p>
            </div>

            <div className="rounded-2xl border-2 border-ink bg-card shadow-[var(--shadow-card)] p-5 space-y-4">
              <StatBar label="HP" value={pet.stats.hp} max={220} tone="primary" />
              <StatBar label="Strength" value={pet.stats.str} max={28} tone="warning" />
              <StatBar label="Agility" value={pet.stats.agi} max={28} tone="arcade" />
              <StatBar label="Intellect" value={pet.stats.int} max={28} tone="success" />
            </div>

            <div className="rounded-2xl border-2 border-ink bg-card shadow-[var(--shadow-card)] p-5">
              <div className="font-mono-ui text-[11px] uppercase tracking-wider text-muted-foreground mb-3">
                care_loop
              </div>
              <div className="grid grid-cols-2 gap-3">
                <TactileButton variant="secondary">🍖 Feed</TactileButton>
                <TactileButton variant="ghost">🎾 Play</TactileButton>
                <TactileButton>⚔ Enter Arena</TactileButton>
                <TactileButton variant="ink">🥚 Breed</TactileButton>
              </div>
            </div>
          </section>
        </div>
      </main>
    </div>
  );
}
