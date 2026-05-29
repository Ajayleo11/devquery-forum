import { requireAuth } from "@/lib/auth/middleware";
import { db } from "@/lib/db";
import { answers, questions, userProfile } from "@/lib/db/schema";
import { eq, sql } from "drizzle-orm";
import { NextRequest, NextResponse } from "next/server";

export async function DELETE(
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
    });

    if (!answer) {
      return NextResponse.json(
        { success: false, error: "Answer not found" },
        { status: 404 }
      );
    }

    if (answer.authorId !== userId) {
      return NextResponse.json(
        { success: false, error: "Only the answer author can delete this answer" },
        { status: 403 }
      );
    }

    if (answer.isAiGenerated) {
      return NextResponse.json(
        { success: false, error: "AI-generated answers cannot be deleted" },
        { status: 400 }
      );
    }

    if (answer.isAccepted && answer.authorId) {
      await db.batch([
        db.update(answers).set({ isDeleted: true }).where(eq(answers.id, answerId)),
        db.update(userProfile)
          .set({ answersCount: sql`${userProfile.answersCount} - 1` })
          .where(eq(userProfile.userId, answer.authorId)),
        db.update(questions)
          .set({ acceptedAnswerId: null })
          .where(eq(questions.id, answer.questionId)),
      ]);
    } else if (answer.isAccepted) {
      await db.batch([
        db.update(answers).set({ isDeleted: true }).where(eq(answers.id, answerId)),
        db.update(questions)
          .set({ acceptedAnswerId: null })
          .where(eq(questions.id, answer.questionId)),
      ]);
    } else if (answer.authorId) {
      await db.batch([
        db.update(answers).set({ isDeleted: true }).where(eq(answers.id, answerId)),
        db.update(userProfile)
          .set({ answersCount: sql`${userProfile.answersCount} - 1` })
          .where(eq(userProfile.userId, answer.authorId)),
      ]);
    } else {
      await db.update(answers).set({ isDeleted: true }).where(eq(answers.id, answerId));
    }

    return NextResponse.json({ success: true, message: "Answer deleted successfully" });
  } catch (error) {
    console.error("Error deleting answer:", error);
    return NextResponse.json(
      { success: false, error: "Failed to delete answer" },
      { status: 500 }
    );
  }
}