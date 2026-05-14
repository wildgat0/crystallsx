const BASE_URL = "https://api.trackingmore.com/v4";

function headers() {
  return {
    "Tracking-Api-Key": process.env.TRACKINGMORE_API_KEY!,
    "Content-Type": "application/json",
  };
}

export const CARRIERS = [
  { code: "correos-de-chile", name: "Correos Chile" },
  { code: "chilexpress",      name: "Chilexpress" },
  { code: "starken",          name: "Starken" },
  { code: "blue-express",     name: "Blue Express" },
  { code: "china-post",       name: "China Post" },
  { code: "yunexpress",       name: "YunExpress" },
  { code: "4px",              name: "4PX" },
  { code: "cainiao",          name: "Cainiao" },
  { code: "sf-express",       name: "SF Express" },
  { code: "dhl",              name: "DHL" },
  { code: "fedex",            name: "FedEx" },
  { code: "ups",              name: "UPS" },
];

export async function registerTracking(trackingNumber: string) {
  const res = await fetch(`${BASE_URL}/trackings/create`, {
    method: "POST",
    headers: headers(),
    body: JSON.stringify({ tracking_number: trackingNumber }),
  });
  return res.json();
}

export async function getTracking(trackingNumber: string) {
  const params = new URLSearchParams({ tracking_numbers: trackingNumber });
  const res = await fetch(`${BASE_URL}/trackings/get?${params}`, {
    headers: headers(),
    cache: "no-store",
  });
  return res.json();
}
