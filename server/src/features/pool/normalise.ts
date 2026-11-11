/**
 * A title as search compares it: accents dropped, lower case, every run of
 * anything but letters and digits made one space. "Amélie" and "amelie",
 * "Spider-Man" and "spider man" read the same.
 */
export function normaliseTitle(title: string): string {
  return title
    .normalize("NFKD")
    .replace(/\p{M}+/gu, "")
    .toLowerCase()
    .replace(/&/g, " and ")
    .replace(/[^\p{L}\p{N}]+/gu, " ")
    .trim();
}
