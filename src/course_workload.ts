import { z } from "zod";

export const courseBriefSchema = z.object({
  course: z.object({
    title: z.string().min(1),
    delivery_goal: z.string().min(1),
    next_session_at: z.string().datetime(),
  }),
  learners: z.array(z.object({
    name: z.string().min(1),
    assignment: z.string().min(1),
    due_at: z.string().datetime(),
    completed: z.boolean(),
  })).min(1),
  educator_report: z.object({
    audience: z.string().min(1),
    question: z.string().min(1),
  }),
  as_of: z.string().datetime(),
});

export type CourseBriefInput = z.infer<typeof courseBriefSchema>;

export function buildCoursePrompt(input: CourseBriefInput): string {
  const asOf = Date.parse(input.as_of);
  const learners = [...input.learners].sort((a, b) => {
    const aOverdue = !a.completed && Date.parse(a.due_at) < asOf;
    const bOverdue = !b.completed && Date.parse(b.due_at) < asOf;
    if (aOverdue !== bOverdue) return aOverdue ? -1 : 1;
    return Date.parse(a.due_at) - Date.parse(b.due_at);
  });

  const roster = learners.map((learner) => {
    const state = learner.completed
      ? "completed"
      : Date.parse(learner.due_at) < asOf
        ? "overdue"
        : "open";
    return `- ${learner.name}: ${learner.assignment}; due ${learner.due_at}; ${state}`;
  }).join("\n");

  return [
    `Course: ${input.course.title}`,
    `Delivery goal: ${input.course.delivery_goal}`,
    `Next session: ${input.course.next_session_at}`,
    `Planning time: ${input.as_of}`,
    "Learners, ordered for educator attention:",
    roster,
    `Reporting audience: ${input.educator_report.audience}`,
    `Reporting question: ${input.educator_report.question}`,
    "Return JSON with delivery_actions, learner_followups, and educator_summary.",
  ].join("\n");
}
