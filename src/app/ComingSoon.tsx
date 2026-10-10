import { Hammer } from "lucide-react";
import { ButtonLink, EmptyState } from "@ui/index";

const COPY: Record<string, { title: string; body: string }> = {
  tracks: { title: "Learning tracks are being forged", body: "Interactive lessons for DSA, System Design, Java & Spring, Behavioral, DevOps and AI engineering land here." },
  review: { title: "Spaced repetition is being forged", body: "Your daily review deck, scheduled with FSRS, lands here." },
  arcade: { title: "The arcade is being forged", body: "Quick-fire drills like Pattern Match and Big-O Blitz land here." },
  profile: { title: "Your trophy room is being forged", body: "Levels, achievements and your full activity history land here." },
};

/** Temporary placeholder for destinations still being built. */
export default function ComingSoon({ feature }: { feature: keyof typeof COPY }) {
  const copy = COPY[feature];
  return (
    <EmptyState icon={<Hammer size={26} />} title={copy.title} actions={<ButtonLink to="/">Back to Today</ButtonLink>}>
      {copy.body}
    </EmptyState>
  );
}
