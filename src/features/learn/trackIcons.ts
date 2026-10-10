import { BrainCircuit, Coffee, Container, MessagesSquare, Network, Waypoints, type LucideIcon } from "lucide-react";
import type { TrackId } from "@app-types/index";

export const TRACK_ICON: Record<TrackId, LucideIcon> = {
  dsa: Waypoints,
  "system-design": Network,
  java: Coffee,
  behavioral: MessagesSquare,
  devops: Container,
  ai: BrainCircuit,
};
