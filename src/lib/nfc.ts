export function getAppBaseUrl(): string {
  const envBaseUrl = import.meta.env.VITE_APP_BASE_URL as string | undefined;

  if (envBaseUrl) {
    return envBaseUrl.replace(/\/$/, '');
  }

  const viteBase = import.meta.env.BASE_URL || '/';
  const cleanBase = viteBase.endsWith('/') ? viteBase.slice(0, -1) : viteBase;

  return `${window.location.origin}${cleanBase}`;
}

export function buildCheckinUrl(token: string): string {
  return `${getAppBaseUrl()}/#/checkin/${token}`;
}

export async function copyToClipboard(text: string): Promise<void> {
  await navigator.clipboard.writeText(text);
}