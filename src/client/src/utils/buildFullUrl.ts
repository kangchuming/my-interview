export function buildFullUrl(url: string, auth: Record<string, string>) {
    const arr = [];
    for (const key in auth) {
      arr.push(`${key}=${encodeURIComponent(auth[key])}`);
    }
    return `${url}?${arr.join('&')}`;
  }