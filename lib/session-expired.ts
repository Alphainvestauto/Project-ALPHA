import type { useRouter } from "next/navigation";

/**
 * The API middleware returns 401 when the shared session has expired.
 * Bounce to /login instead of showing a misleading generic error.
 */
export function handleSessionExpired(
  res: Response,
  router: ReturnType<typeof useRouter>
): boolean {
  if (res.status === 401) {
    router.push("/login");
    return true;
  }
  return false;
}
