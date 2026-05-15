export interface BinCheckResult {
  code: number;
  status: string;
  message: string;
  card: {
    card: string;
    bank: string;
    type: string;
    category: string;
    brand: string;
    country: {
      name: string;
      code: string;
      emoji: string;
      currency: string;
    };
  };
}

export async function checkBin(cardData: string): Promise<BinCheckResult> {
  const apiKey = process.env.RAPIDAPI_KEY;
  if (!apiKey) {
    throw new Error("RAPIDAPI_KEY not configured");
  }

  const response = await fetch("https://bin-checker19.p.rapidapi.com/", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-rapidapi-host": "bin-checker19.p.rapidapi.com",
      "x-rapidapi-key": apiKey,
    },
    body: JSON.stringify({ data: cardData }),
  });

  if (!response.ok) {
    throw new Error(`API Error: ${response.status}`);
  }

  return response.json() as Promise<BinCheckResult>;
}
