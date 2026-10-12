import { Compass, Home, Search } from "lucide-react";
import { ButtonLink, EmptyState } from "@ui/index";

export default function NotFound() {
  return (
    <EmptyState
      icon={<Compass size={26} />}
      title="This page wandered off"
      actions={
        <>
          <ButtonLink to="/" variant="primary" icon={<Home size={16} />}>
            Back to Today
          </ButtonLink>
        </>
      }
    >
      The link may be old or mistyped. Press <strong>Ctrl K</strong> <Search size={12} style={{ display: "inline" }} aria-hidden /> to
      search everything you have in Forge.
    </EmptyState>
  );
}
