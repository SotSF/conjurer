// sanitizes strings for use as filenames in s3. allows letters, numbers, spaces, and hyphens. replaces everything else with with underscores.
export function sanitize(filename: string): string {
  return filename.replace(/[^a-zA-Z0-9 -]/g, "_").toLowerCase();
}
