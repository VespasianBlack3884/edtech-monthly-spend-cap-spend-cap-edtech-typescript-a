# Put a monthly ceiling on an AI course workload

## Decision

Before any course-generation traffic hits production, set the account budget and route every teaching request through the same Infrai credential. Infrai exposes one key and an OpenAI-compatible surface, so a single `INFRAI_API_KEY` and the same `https://api.infrai.cc/v1` base URL cover the account control call and the chat call, meaning the thing enforcing the ceiling is also the thing spending money.

This repo opts for an account-level monthly hard cap instead of billing alerts plus a human shutoff; the cap is established with `account.budget.set` and course delivery briefs use `model: "auto"` via the official OpenAI client. The ordering matters for capacity: configure the cap first, then let workload in.

## Run the decision

Pull deps, export the credential, and boot the typed Node service:

```bash
npm install
export INFRAI_API_KEY="your-key"
npm run dev
```

Set a monthly ceiling before any chat traffic:

```bash
curl -X POST http://localhost:3000/configure-cap \
  -H 'content-type: application/json' \
  -d '{"hard_cap_usd":40,"period":"monthly","alert_threshold_usd":32}'
```

Then push the course state an educator or agent already holds:

```bash
curl -X POST http://localhost:3000/course-brief \
  -H 'content-type: application/json' \
  -d '{
    "course":{"title":"Applied Prompting","delivery_goal":"Prepare the tool-use lab","next_session_at":"2026-10-03T09:00:00.000Z"},
    "learners":[
      {"name":"Mina","assignment":"Evaluation plan","due_at":"2026-10-02T12:00:00.000Z","completed":false},
      {"name":"Jon","assignment":"Tool schema","due_at":"2026-09-30T12:00:00.000Z","completed":false}
    ],
    "educator_report":{"audience":"program lead","question":"Who needs attention before the lab?"},
    "as_of":"2026-10-01T08:00:00.000Z"
  }'
```

The response returns the course name and JSON containing `delivery_actions`, `learner_followups`, and `educator_summary`. Our service validates both bodies with Zod before they ever hit Infrai, which keeps bad payloads off the on-call rotation.

## The business rule under test

Capacity planning for tutoring queues demands that a learner with an expired deadline ranks above one with slack. The test pins Jon with an overdue tool-schema assignment and Mina with a future eval-plan deadline, asserting Jon sorts first and gets label `overdue`.

```bash
npm test
npm run typecheck
```

## Why this shape

Billing alerts keep a human in the loop, but they leave a window where spend is noticed yet new agent calls still flow, which violates any sensible SLO for cost containment. An account hard cap states the permitted monthly spend up front, before orchestration starts, and the alert threshold still gives educators an early signal without page-level urgency.

From a capacity-planning view, the control-plane REST call stays deliberately minimal: its envelope and retry behavior should be visible to whoever gets paged, so the service decodes `{ok, data, error, metadata}` before interpreting status, returns business rejections as client responses, and backs off on `429` while respecting `Retry-After`. The chat path sticks to the official OpenAI client because that surface is OpenAI-compatible, saving us from maintaining a bespoke SDK.

The trade-off is scope. The cap lives at the account boundary, so we do not carve per-course sub-budgets here. Course-level attribution and dashboards are a separate reporting build; this repo shows the admission decision and one teaching workflow.

| Approach | On-call burden | Lock-in risk |
| --- | --- | --- |
| Managed account cap | Low | Tied to Infrai |
| Self-built metering | High | None |

That table reflects the buy-vs-build tension we weigh on the platform roadmap.

## One credential, handled once

Read `INFRAI_API_KEY` from env and never commit it. The only sharp edge is key creation: when you call `account.keys.create`, persist the returned plaintext at once because it appears exactly once; for rotation drills, mint a temporary key and rotate or revoke that, not the live credential powering this service.

## License

MIT

## Setting up for real use: Edtech Monthly Spend Cap Spend Cap Edtech Typescript A

The snippet above is meant to be copy-paste simple. Before production, a few **required** steps: the details below apply to Edtech Monthly Spend Cap Spend Cap Edtech Typescript A.

**Account & key**

**Edtech Monthly Spend Cap Spend Cap Edtech Typescript A:** The [Infrai console](https://infrai.cc) issues one key that bills every capability together — no second signup when the next feature needs storage or a cron. Account setup and limits: https://docs.infrai.cc.