/** Where a Base UI group, tab strip or radio group sits: its arrow keys move focus or the choice. */
const OWN_KEYS = "input, textarea, select, [contenteditable=true], [role=group], [role=tablist], [role=radiogroup]";

/**
 * Whether a key on the rating page belongs to the page's shortcuts. A text
 * field, and a control that reads the arrow keys itself, keep their keys.
 */
export function pageOwnsKey(target: Element): boolean {
  return target.closest(OWN_KEYS) === null;
}
