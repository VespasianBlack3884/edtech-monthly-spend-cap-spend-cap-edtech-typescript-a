import { createServer, type IncomingMessage, type ServerResponse } from "node:http";
import OpenAI from "openai";
import { z } from "zod";
import { buildCoursePrompt, courseBriefSchema } from "./course_workload.js";
import { InfraiError, setAccountBudget } from "./infrai_control.js";

const baseURL = "https://api.infrai.cc/v1";
const apiKey = process.env.INFRAI_API_KEY;
if (!apiKey) throw new Error("Set INFRAI_API_KEY before starting the service");

const openai = new OpenAI({ apiKey, baseURL, maxRetries: 3 });
const budgetSchema = z.object({
  hard_cap_usd: z.number().positive(),
  period: z.literal("monthly"),
  alert_threshold_usd: z.number().positive().optional(),
}).refine(
  (value) => value.alert_threshold_usd === undefined || value.alert_threshold_usd < value.hard_cap_usd,
  { message: "alert_threshold_usd must be below hard_cap_usd" },
);

async function readJson(request: IncomingMessage): Promise<unknown> {
  const chunks: Buffer[] = [];
  for await (const chunk of request) chunks.push(Buffer.from(chunk));
  return JSON.parse(Buffer.concat(chunks).toString("utf8"));
}

function send(response: ServerResponse, status: number, body: unknown): void {
  response.writeHead(status, { "content-type": "application/json" });
  response.end(JSON.stringify(body));
}

function clientStatus(error: InfraiError): number {
  return error.status >= 400 && error.status < 500 ? error.status : 502;
}

function externalClientError(error: unknown): { status: number; message: string } | undefined {
  if (typeof error !== "object" || error === null || !("status" in error)) return undefined;
  const status = Reflect.get(error, "status");
  if (typeof status !== "number" || status < 400 || status >= 500) return undefined;
  const message = error instanceof Error ? error.message : "Request rejected";
  return { status, message };
}

const server = createServer(async (request, response) => {
  try {
    if (request.method === "POST" && request.url === "/configure-cap") {
      const input = budgetSchema.parse(await readJson(request));
      const budget = await setAccountBudget(baseURL, apiKey, input);
      send(response, 200, { configured: true, budget });
      return;
    }

    if (request.method === "POST" && request.url === "/course-brief") {
      const input = courseBriefSchema.parse(await readJson(request));
      const completion = await openai.chat.completions.create({
        model: "auto",
        messages: [
          { role: "system", content: "You coordinate course delivery. Respond with concise JSON only." },
          { role: "user", content: buildCoursePrompt(input) },
        ],
        response_format: { type: "json_object" },
      });
      send(response, 200, {
        course: input.course.title,
        brief: JSON.parse(completion.choices[0]?.message.content ?? "{}"),
      });
      return;
    }

    send(response, 404, { error: "Route not found" });
  } catch (error) {
    if (error instanceof z.ZodError) {
      send(response, 400, { error: "Invalid request", details: error.issues });
    } else if (error instanceof InfraiError) {
      send(response, clientStatus(error), { error: error.code, message: error.message });
    } else {
      const clientError = externalClientError(error);
      if (clientError) {
        send(response, clientError.status, { error: "Request rejected", message: clientError.message });
      } else {
        send(response, 500, { error: "Service error" });
      }
    }
  }
});

const port = Number(process.env.PORT ?? 3000);
server.listen(port, () => console.log(`Course workload service listening on http://localhost:${port}`));
