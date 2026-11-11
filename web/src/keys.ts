/**
 * Where a text field, tab strip or radio group sits: its arrow keys edit, move focus or choose.
 * A plain `role=group` is not listed: the rating buttons sit in one, and the arrows must keep
 * swiping after one of them is tapped. The state picker's group (a Base UI toggle group) is
 * not on this page.
 */
const OWN_KEYS = "input, textarea, select, [contenteditable=true], [role=tablist], [role=radiogroup]";

/**
 * Whether a key on the rating page belongs to the page's shortcuts. A text
 * field, and a control that reads the arrow keys itself, keep their keys.
 */
export function pageOwnsKey(target: Element): boolean {
  return target.closest(OWN_KEYS) === null;
}
