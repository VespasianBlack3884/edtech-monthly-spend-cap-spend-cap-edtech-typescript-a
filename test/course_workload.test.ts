import assert from "node:assert/strict";
import test from "node:test";
import { buildCoursePrompt } from "../src/course_workload.js";

test("an overdue learner is placed before a later open deadline", () => {
  const prompt = buildCoursePrompt({
    course: {
      title: "Applied Prompting",
      delivery_goal: "Prepare the tool-use lab",
      next_session_at: "2026-10-03T09:00:00.000Z",
    },
    learners: [
      { name: "Mina", assignment: "Evaluation plan", due_at: "2026-10-02T12:00:00.000Z", completed: false },
      { name: "Jon", assignment: "Tool schema", due_at: "2026-09-30T12:00:00.000Z", completed: false },
    ],
    educator_report: { audience: "program lead", question: "Who needs attention before the lab?" },
    as_of: "2026-10-01T08:00:00.000Z",
  });

  assert.ok(prompt.indexOf("Jon: Tool schema") < prompt.indexOf("Mina: Evaluation plan"));
  assert.match(prompt, /Jon: Tool schema; due .*; overdue/);
});
