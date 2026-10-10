// Extra grammars Forge needs beyond prism-react-renderer's defaults.
// Order matters: the setup module must evaluate before the components.
import "./prismSetup";
import "prismjs/components/prism-java";
import "prismjs/components/prism-kotlin";
import "prismjs/components/prism-typescript";
import "prismjs/components/prism-bash";
import "prismjs/components/prism-yaml";
import "prismjs/components/prism-docker";
import "prismjs/components/prism-properties";

export const LANGUAGE_LABEL: Record<string, string> = {
  java: "Java",
  kotlin: "Kotlin",
  ts: "TypeScript",
  typescript: "TypeScript",
  js: "JavaScript",
  javascript: "JavaScript",
  py: "Python",
  python: "Python",
  sql: "SQL",
  bash: "Shell",
  sh: "Shell",
  shell: "Shell",
  yaml: "YAML",
  yml: "YAML",
  docker: "Dockerfile",
  dockerfile: "Dockerfile",
  json: "JSON",
  properties: "Properties",
  go: "Go",
  text: "Text",
};

const ALIASES: Record<string, string> = { yml: "yaml", sh: "bash", shell: "bash", dockerfile: "docker", ts: "typescript", js: "javascript", py: "python" };

export function normaliseLanguage(lang: string | undefined): string {
  const l = (lang ?? "").toLowerCase();
  return ALIASES[l] ?? (l || "text");
}
