import { db } from "@/lib/db";
import { answers, questions, userProfile } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import { NextRequest, NextResponse } from "next/server";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    const userData = await db.query.user.findFirst({
      where: (user, { eq }) => eq(user.id, id),
    });

    if (!userData) {
      return NextResponse.json(
        { success: false, error: "User not found" },
        { status: 404 }
      );
    }

    const profile = await db.query.userProfile.findFirst({
      where: eq(userProfile.userId, id),
    });

    const userQuestions = await db.query.questions.findMany({
      where: eq(questions.authorId, id),
      orderBy: (questions, { desc }) => [desc(questions.createdAt)],
      limit: 10,
    });

    const userAnswers = await db.query.answers.findMany({
      where: eq(answers.authorId, id),
      orderBy: (answers, { desc }) => [desc(answers.createdAt)],
      limit: 10,
      with: {
        question: { columns: { id: true, title: true } },
      },
    });

    return NextResponse.json({
      success: true,
      data: {
        user: userData,
        profile,
        questions: userQuestions,
        answers: userAnswers,
      },
    });
  } catch (error) {
    console.error("Error fetching user:", error);
    return NextResponse.json(
      { success: false, error: "Failed to fetch user" },
      { status: 500 }
    );
  }
}