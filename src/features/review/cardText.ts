// Cloze support: "The {{answer}} goes here" hides the braces' content on the front.

export function clozeFront(text: string): string {
  return text.replace(/\{\{(.+?)\}\}/g, "**[ … ]**");
}

export function clozeBack(text: string): string {
  return text.replace(/\{\{(.+?)\}\}/g, "**$1**");
}

export function isCloze(text: string): boolean {
  return /\{\{.+?\}\}/.test(text);
}
