import { useEffect, useMemo, type ReactNode } from "react";
import { MessagesSquare, Sparkles } from "lucide-react";
import { Button, Kbd, Tooltip } from "@ui/index";
import { PaletteExtensionsContext, type PaletteExtensions } from "@app/paletteRegistry";
import { useTutor } from "./TutorContext";

/** Ctrl/Cmd+J toggles the tutor; also contributes tutor commands to the palette. */
export function CopilotBridge({ children }: { children: ReactNode }) {
  const { setOpen, open, ask } = useTutor();

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "j") {
        e.preventDefault();
        setOpen(!open);
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, setOpen]);

  const extensions = useMemo<PaletteExtensions>(
    () => ({
      actions: [
        { id: "tutor", label: "Ask Forge (AI tutor)", hint: "Ctrl J", icon: <MessagesSquare size={16} />, keywords: ["ai", "help", "explain", "chat"], run: () => ask() },
        { id: "tutor-quiz", label: "Quiz me on my weak spots", icon: <Sparkles size={16} />, keywords: ["ai", "test"], run: () => ask("Quiz me with 3 questions on whatever I'm weakest at right now. One at a time.") },
      ],
      groups: [],
    }),
    [ask],
  );

  return <PaletteExtensionsContext.Provider value={extensions}>{children}</PaletteExtensionsContext.Provider>;
}

export function TutorButton() {
  const { ask } = useTutor();
  return (
    <Tooltip content={<span>Ask Forge <Kbd>Ctrl J</Kbd></span>}>
      <Button variant="soft" size="md" icon={<Sparkles size={16} />} onClick={() => ask()} aria-label="Ask Forge, the AI tutor">
        <span className="u-hide-sm">Ask Forge</span>
      </Button>
    </Tooltip>
  );
}
