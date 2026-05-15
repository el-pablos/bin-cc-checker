const BASE = "/api";

export interface GeneratedCardResponse {
  number: string;
  expMonth: string;
  expYear: string;
  cvv: string;
  type: string;
  typeCode: string;
  formatted: string;
  codeName: string;
}

export interface ValidateResponse {
  success: boolean;
  isValid: boolean;
  cardType: { title: string; type: string } | null;
  errors: string[];
}

export interface BinCheckResponse {
  success: boolean;
  result: {
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
  };
  error?: string;
}

export interface HistoryRecord {
  id: number;
  type: string;
  source: string;
  input: string | null;
  output: string | null;
  card_number: string | null;
  card_type: string | null;
  is_valid: number | null;
  bin_result: string | null;
  created_at: string;
}

export interface HistoryResponse {
  success: boolean;
  records: HistoryRecord[];
  pagination: {
    total: number;
    limit: number;
    offset: number;
    hasMore: boolean;
  };
}

export async function apiGenerate(
  type?: string,
  quantity = 5,
): Promise<GeneratedCardResponse[]> {
  const res = await fetch(`${BASE}/generate`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ type, quantity }),
  });
  const data = await res.json();
  if (!data.success) throw new Error("Generate failed");
  return data.cards;
}

export async function apiValidate(
  number: string,
  expMonth: string,
  expYear: string,
  cvv: string,
): Promise<ValidateResponse> {
  const res = await fetch(`${BASE}/validate`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ number, expMonth, expYear, cvv }),
  });
  return res.json();
}

export async function apiBinCheck(data: string): Promise<BinCheckResponse> {
  const res = await fetch(`${BASE}/bin-check`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ data }),
  });
  return res.json();
}

export async function apiHistory(
  limit = 50,
  offset = 0,
  type?: string,
): Promise<HistoryResponse> {
  const params = new URLSearchParams({
    limit: String(limit),
    offset: String(offset),
  });
  if (type) params.set("type", type);
  const res = await fetch(`${BASE}/history?${params}`);
  return res.json();
}

export async function apiClearHistory(): Promise<void> {
  await fetch(`${BASE}/history`, { method: "DELETE" });
}

export interface BulkValidateResult {
  card: string;
  isValid: boolean;
  cardType: string | null;
  errors: string[];
}

export interface BulkValidateResponse {
  success: boolean;
  total: number;
  valid: number;
  invalid: number;
  results: BulkValidateResult[];
}

export async function apiBulkValidate(
  cards: string[],
): Promise<BulkValidateResponse> {
  const res = await fetch(`${BASE}/validate/bulk`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ cards }),
  });
  return res.json();
}

export async function apiValidateFile(
  file: File,
): Promise<BulkValidateResponse> {
  const formData = new FormData();
  formData.append("file", file);
  const res = await fetch(`${BASE}/validate/file`, {
    method: "POST",
    body: formData,
  });
  return res.json();
}
