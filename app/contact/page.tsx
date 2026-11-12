import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Contact — Creative Cat",
};

export default function ContactPage() {
  return (
    <main className="flex min-h-svh flex-col justify-end px-6 pb-24 pt-40 md:px-10 lg:px-14">
      <h1 className="font-heading text-6xl">Contact</h1>
      <p className="mt-3 max-w-sm text-sm text-muted-foreground">
        Placeholder route. The contact form arrives in a later phase.
      </p>
    </main>
  );
}
