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
  const response = await fetch("https://bin-checker19.p.rapidapi.com/", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-rapidapi-host": "bin-checker19.p.rapidapi.com",
      "x-rapidapi-key": "02409ba636msh340be36191f4812p152162jsn48501b7c6b53",
    },
    body: JSON.stringify({ data: cardData }),
  });

  if (!response.ok) {
    throw new Error(`API Error: ${response.status}`);
  }

  return response.json();
}
