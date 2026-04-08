/** True when shortcuts should not run (typing, modal, etc.). */
export function vjKeydownTargetIgnoresShortcuts(target: EventTarget | null): boolean {
  if (!(target instanceof HTMLElement)) return true;
  if (target.closest('[role="dialog"]')) return true;
  if (target.isContentEditable) return true;
  const tag = target.tagName;
  if (tag === "INPUT" || tag === "TEXTAREA" || tag === "SELECT") return true;
  return false;
}
