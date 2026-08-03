export function getInitials(name: string): string {
  const parts = name.trim().split(/\s+/);
  const initials =
    parts.length > 1 ? [parts[0], parts[parts.length - 1]] : [parts[0]];
  return initials
    .map((part) => part[0])
    .join("")
    .toUpperCase();
}
