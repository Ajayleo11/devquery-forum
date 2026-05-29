import { requireAuth } from "@/lib/auth/middleware";
import { db } from "@/lib/db";
import { answers, answerVotes, userProfile } from "@/lib/db/schema";
import { and, eq, sql } from "drizzle-orm";
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
    const { voteType } = await request.json();

    if (!voteType || !["upvote", "downvote"].includes(voteType)) {
      return NextResponse.json(
        { success: false, error: "Invalid vote type" },
        { status: 400 }
      );
    }

    const existingVote = await db.query.answerVotes.findFirst({
      where: and(eq(answerVotes.answerId, answerId), eq(answerVotes.userId, userId!)),
    });

    const answer = await db.query.answers.findFirst({
      where: eq(answers.id, answerId),
    });

    if (!answer) {
      return NextResponse.json(
        { success: false, error: "Answer not found" },
        { status: 404 }
      );
    }

    if (answer.authorId === userId) {
      return NextResponse.json(
        { success: false, error: "Cannot vote on your own answer" },
        { status: 400 }
      );
    }

    if (existingVote) {
      if (existingVote.voteType === voteType) {
        const voteChange = voteType === "upvote" ? -1 : 1;
        const repChange = voteType === "upvote" ? -10 : 2;

        if (answer.authorId) {
          await db.batch([
            db.delete(answerVotes).where(
              and(eq(answerVotes.answerId, answerId), eq(answerVotes.userId, userId!))
            ),
            db.update(answers)
              .set({ votes: sql`${answers.votes} + ${voteChange}` })
              .where(eq(answers.id, answerId)),
            db.update(userProfile)
              .set({ reputation: sql`${userProfile.reputation} + ${repChange}` })
              .where(eq(userProfile.userId, answer.authorId)),
          ]);
        } else {
          await db.batch([
            db.delete(answerVotes).where(
              and(eq(answerVotes.answerId, answerId), eq(answerVotes.userId, userId!))
            ),
            db.update(answers)
              .set({ votes: sql`${answers.votes} + ${voteChange}` })
              .where(eq(answers.id, answerId)),
          ]);
        }
      } else {
        const voteChange = voteType === "upvote" ? 2 : -2;
        const repChange = voteType === "upvote" ? 12 : -12;

        if (answer.authorId) {
          await db.batch([
            db.update(answerVotes)
              .set({ voteType: voteType as "upvote" | "downvote" })
              .where(and(eq(answerVotes.answerId, answerId), eq(answerVotes.userId, userId!))),
            db.update(answers)
              .set({ votes: sql`${answers.votes} + ${voteChange}` })
              .where(eq(answers.id, answerId)),
            db.update(userProfile)
              .set({ reputation: sql`${userProfile.reputation} + ${repChange}` })
              .where(eq(userProfile.userId, answer.authorId)),
          ]);
        } else {
          await db.batch([
            db.update(answerVotes)
              .set({ voteType: voteType as "upvote" | "downvote" })
              .where(and(eq(answerVotes.answerId, answerId), eq(answerVotes.userId, userId!))),
            db.update(answers)
              .set({ votes: sql`${answers.votes} + ${voteChange}` })
              .where(eq(answers.id, answerId)),
          ]);
        }
      }
    } else {
      const voteChange = voteType === "upvote" ? 1 : -1;
      const repChange = voteType === "upvote" ? 10 : -2;

      if (answer.authorId) {
        await db.batch([
          db.insert(answerVotes).values({
            answerId,
            userId: userId!,
            voteType: voteType as "upvote" | "downvote",
          }),
          db.update(answers)
            .set({ votes: sql`${answers.votes} + ${voteChange}` })
            .where(eq(answers.id, answerId)),
          db.update(userProfile)
            .set({ reputation: sql`${userProfile.reputation} + ${repChange}` })
            .where(eq(userProfile.userId, answer.authorId)),
        ]);
      } else {
        await db.batch([
          db.insert(answerVotes).values({
            answerId,
            userId: userId!,
            voteType: voteType as "upvote" | "downvote",
          }),
          db.update(answers)
            .set({ votes: sql`${answers.votes} + ${voteChange}` })
            .where(eq(answers.id, answerId)),
        ]);
      }
    }

    const updatedAnswer = await db.query.answers.findFirst({
      where: eq(answers.id, answerId),
    });

    const currentUserVote = await db.query.answerVotes.findFirst({
      where: and(eq(answerVotes.answerId, answerId), eq(answerVotes.userId, userId!)),
    });

    return NextResponse.json({
      success: true,
      message: "Vote recorded",
      votes: updatedAnswer?.votes || 0,
      userVote: currentUserVote?.voteType || null,
    });
  } catch (error) {
    console.error("Error voting on answer:", error);
    return NextResponse.json(
      { success: false, error: "Failed to vote" },
      { status: 500 }
    );
  }
}