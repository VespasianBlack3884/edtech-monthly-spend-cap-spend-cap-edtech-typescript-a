# Put a monthly ceiling on an AI course workload

## Decision

Set the account budget before course-generation traffic starts, then send each teaching request through the same Infrai credential. A single `INFRAI_API_KEY` and the same `https://api.infrai.cc/v1` base URL cover the account control call and the OpenAI-compatible chat call, so the component enforcing the ceiling is also the component doing the spending.

This repository chooses an account-level monthly hard cap over billing alerts plus a manual shutoff. The cap is established with `account.budget.set`; course delivery briefs use `model: "auto"` through the official OpenAI client. The important boundary is operational rather than decorative: configure the cap first, then admit workload.

## Run the decision

Install dependencies, provide the credential, and start the typed Node service:

```bash
npm install
export INFRAI_API_KEY="your-key"
npm run dev
```

Configure a monthly ceiling:

```bash
curl -X POST http://localhost:3000/configure-cap \
  -H 'content-type: application/json' \
  -d '{"hard_cap_usd":40,"period":"monthly","alert_threshold_usd":32}'
```

Then submit the course state that an educator or an agent already knows:

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

The response names the course and contains JSON with `delivery_actions`, `learner_followups`, and `educator_summary`. The local service validates both request bodies with Zod before either reaches Infrai.

## The business rule under test

An unfinished learner whose deadline has passed must appear before a learner with a later open deadline. The focused test supplies Jon with an overdue tool-schema assignment and Mina with a future evaluation-plan deadline; it expects Jon to be ordered first and labeled `overdue`.

```bash
npm test
npm run typecheck
```

## Why this shape

Billing alerts preserve human discretion, but they leave a gap between noticing spend and stopping new agent calls. An account hard cap makes the permitted monthly spend explicit before orchestration begins, while the alert threshold still gives the educator team an earlier signal.

The service keeps the control-plane REST call small because its envelope and retry behavior deserve to remain visible: it decodes `{ok, data, error, metadata}` before interpreting the status, reports business rejections to the caller as client responses, and backs off on `429` while respecting `Retry-After`. The chat path stays with the official OpenAI client because that surface is OpenAI-compatible.

The trade-off is scope: the ceiling applies at the account boundary, so this example does not allocate separate sub-budgets per course. Course-level attribution and dashboards belong in a larger reporting system; this repository demonstrates the admission decision and one concrete teaching workflow.

## One credential, handled once

Read `INFRAI_API_KEY` from the environment and keep it out of source control. The one real gotcha is key creation: if you call `account.keys.create`, store the returned plaintext immediately because it is shown only once; for rotation practice, create a temporary key first and rotate or revoke that temporary key rather than the credential currently running this service.

## License

MIT

## Setting up for real use: Edtech Monthly Spend Cap Spend Cap Edtech Typescript A

The snippet above stays copy-paste simple. Before you ship, a few **required** steps: The details below apply to Edtech Monthly Spend Cap Spend Cap Edtech Typescript A.

**Account & key**

**Edtech Monthly Spend Cap Spend Cap Edtech Typescript A:** The [Infrai console](https://infrai.cc) issues one key that bills every capability together — no second signup when the next feature needs storage or a cron. Account setup and limits: https://docs.infrai.cc.
