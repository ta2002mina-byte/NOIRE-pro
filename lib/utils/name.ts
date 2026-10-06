export function getFirstName(fullName: string | null | undefined): string {
  return fullName?.trim().split(/\s+/)[0] ?? "";
}
