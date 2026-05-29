import { requireAuth } from "@/lib/auth/middleware";
import { db } from "@/lib/db";
import { inngest } from "@/lib/services/inngest";
import { answers, questions, userProfile } from "@/lib/db/schema";
import { and, eq, not, sql } from "drizzle-orm";
import { NextRequest, NextResponse } from "next/server";

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const authResult = await requireAuth(request);
    if (authResult.error) return authResult.error;

    const { userId } = authResult;
    const { id } = await params;
    const answerId = parseInt(id);

    const answer = await db.query.answers.findFirst({
      where: eq(answers.id, answerId),
      with: { question: true },
    });

    if (!answer) {
      return NextResponse.json(
        { success: false, error: "Answer not found" },
        { status: 404 }
      );
    }

    if (answer.question.authorId !== userId) {
      return NextResponse.json(
        { success: false, error: "Only the question author can accept answers" },
        { status: 403 }
      );
    }

    if (answer.authorId === userId) {
      return NextResponse.json(
        { success: false, error: "You cannot accept your own answer" },
        { status: 400 }
      );
    }

    if (answer.isAiGenerated) {
      return NextResponse.json(
        { success: false, error: "AI-generated answers cannot be accepted" },
        { status: 400 }
      );
    }

    const isCurrentlyAccepted = answer.isAccepted;

    if (isCurrentlyAccepted) {
      if (answer.authorId) {
        await db.batch([
          db.update(answers).set({ isAccepted: false }).where(eq(answers.id, answerId)),
          db.update(questions).set({ acceptedAnswerId: null }).where(eq(questions.id, answer.questionId)),
          db.update(userProfile)
            .set({ reputation: sql`${userProfile.reputation} - 15` })
            .where(eq(userProfile.userId, answer.authorId)),
        ]);
      } else {
        await db.batch([
          db.update(answers).set({ isAccepted: false }).where(eq(answers.id, answerId)),
          db.update(questions).set({ acceptedAnswerId: null }).where(eq(questions.id, answer.questionId)),
        ]);
      }

      return NextResponse.json({ success: true, message: "Answer unaccepted", accepted: false });
    } else {
      const previouslyAcceptedAnswer = await db.query.answers.findFirst({
        where: and(
          eq(answers.questionId, answer.questionId),
          eq(answers.isAccepted, true),
          not(eq(answers.id, answerId))
        ),
      });

      if (previouslyAcceptedAnswer && previouslyAcceptedAnswer.authorId && answer.authorId) {
        await db.batch([
          db.update(answers).set({ isAccepted: true }).where(eq(answers.id, answerId)),
          db.update(questions).set({ acceptedAnswerId: answerId }).where(eq(questions.id, answer.questionId)),
          db.update(answers).set({ isAccepted: false }).where(eq(answers.id, previouslyAcceptedAnswer.id)),
          db.update(userProfile)
            .set({ reputation: sql`${userProfile.reputation} - 15` })
            .where(eq(userProfile.userId, previouslyAcceptedAnswer.authorId)),
          db.update(userProfile)
            .set({ reputation: sql`${userProfile.reputation} + 15` })
            .where(eq(userProfile.userId, answer.authorId)),
        ]);
      } else if (answer.authorId) {
        await db.batch([
          db.update(answers).set({ isAccepted: true }).where(eq(answers.id, answerId)),
          db.update(questions).set({ acceptedAnswerId: answerId }).where(eq(questions.id, answer.questionId)),
          db.update(userProfile)
            .set({ reputation: sql`${userProfile.reputation} + 15` })
            .where(eq(userProfile.userId, answer.authorId)),
        ]);
      } else {
        await db.batch([
          db.update(answers).set({ isAccepted: true }).where(eq(answers.id, answerId)),
          db.update(questions).set({ acceptedAnswerId: answerId }).where(eq(questions.id, answer.questionId)),
        ]);
      }

      if (answer.authorId) {
        await inngest.send({
          name: "answer.accepted",
          data: { answerId, questionId: answer.questionId, authorId: answer.authorId },
        });
      }

      return NextResponse.json({ success: true, message: "Answer accepted", accepted: true });
    }
  } catch (error) {
    console.error("Error accepting answer:", error);
    return NextResponse.json(
      { success: false, error: "Failed to accept answer" },
      { status: 500 }
    );
  }
}