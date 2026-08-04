import { NextResponse } from "next/server";
import { Prisma } from "@prisma/client";
import bcrypt from "bcryptjs";

import { prisma } from "@/lib/prisma";
import { registerSchema } from "@/schemas";

export async function POST(request: Request) {
  try {
    const body: unknown = await request.json();
    const parsed = registerSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        {
          error:
            parsed.error.issues[0]?.message ?? "Please check your registration details.",
        },
        { status: 400 }
      );
    }

    const { name, companyName, email, phone, password } = parsed.data;
    const normalizedEmail = email.trim().toLowerCase();
    const existingUser = await prisma.user.findUnique({
      where: { email: normalizedEmail },
      select: { id: true },
    });

    if (existingUser) {
      return NextResponse.json(
        { error: "An account with this email already exists." },
        { status: 409 }
      );
    }

    const passwordHash = await bcrypt.hash(password, 12);
    const user = await prisma.$transaction(async (transaction) => {
      const company = await transaction.company.create({
        data: {
          name: companyName.trim(),
          email: normalizedEmail,
          phone: phone?.trim() || null,
        },
      });

      return transaction.user.create({
        data: {
          name: name.trim(),
          email: normalizedEmail,
          phone: phone?.trim() || null,
          password: passwordHash,
          role: "ADMIN",
          companyId: company.id,
        },
        select: { id: true, email: true },
      });
    });

    return NextResponse.json({ user }, { status: 201 });
  } catch (error) {
    if (
      error instanceof Prisma.PrismaClientKnownRequestError &&
      error.code === "P2002"
    ) {
      return NextResponse.json(
        { error: "An account with this email already exists." },
        { status: 409 }
      );
    }

    console.error("Registration failed", error);
    return NextResponse.json(
      { error: "Unable to create your account. Please try again." },
      { status: 500 }
    );
  }
}
