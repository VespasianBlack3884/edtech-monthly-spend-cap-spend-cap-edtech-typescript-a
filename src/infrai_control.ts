export type InfraiErrorBody = {
  code?: string;
  message?: string;
};

type InfraiEnvelope<T> = {
  ok: boolean;
  data?: T;
  error?: InfraiErrorBody;
  metadata?: unknown;
};

export class InfraiError extends Error {
  readonly status: number;
  readonly code: string;

  constructor(
    status: number,
    code: string,
    message: string,
  ) {
    super(message);
    this.name = "InfraiError";
    this.status = status;
    this.code = code;
  }
}

export type BudgetRequest = {
  hard_cap_usd: number;
  period: string;
  alert_threshold_usd?: number;
};

export async function setAccountBudget(
  baseUrl: string,
  apiKey: string,
  body: BudgetRequest,
  fetcher: typeof fetch = fetch,
): Promise<unknown> {
  for (let attempt = 0; attempt < 4; attempt += 1) {
    const response = await fetcher(`${baseUrl}/account/budget/set`, {
      method: "PUT",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(body),
    });

    let envelope: InfraiEnvelope<unknown>;
    try {
      envelope = await response.json() as InfraiEnvelope<unknown>;
    } catch {
      throw new InfraiError(response.status, "INVALID_RESPONSE", "Infrai returned a non-JSON response");
    }

    if (response.status === 429 && attempt < 3) {
      const retryAfter = Number(response.headers.get("retry-after"));
      const waitMs = Number.isFinite(retryAfter) && retryAfter > 0
        ? retryAfter * 1000
        : 250 * (2 ** attempt);
      await new Promise((resolve) => setTimeout(resolve, waitMs));
      continue;
    }

    if (!envelope.ok) {
      throw new InfraiError(
        response.status,
        envelope.error?.code ?? "INFRAI_REJECTED",
        envelope.error?.message ?? "Infrai rejected the request",
      );
    }
    return envelope.data;
  }
  throw new InfraiError(429, "RATE_LIMITED", "Retry window exhausted");
}
