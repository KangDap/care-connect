"use server"

import { prisma } from "@/lib/prisma"
import { auth } from "@/lib/auth/auth"
import { headers } from "next/headers"

export async function submitConsultationForm(formData: FormData) {
  try {
    const session = await auth.api.getSession({ headers: await headers() })
    
    if (!session || !session.user) {
      return { success: false, error: "You must be logged in to submit a consultation." }
    }

    const title = formData.get("title") as string
    const nature = formData.get("nature") as string
    const date = formData.get("date") as string
    const time = formData.get("time") as string
    const description = formData.get("description") as string
    const isAnonymous = formData.get("isAnonymous") === "on"

    // Validate inputs
    if (!title || !nature || !date || !time || !description) {
      return { success: false, error: "Please fill out all required fields, including date and time." }
    }

    // 1. Optional auto-assignment: if psychologist exists, assign immediately.
    const psych = await prisma.user.findFirst({
      where: { role: "PSYCHOLOGIST" }
    })

    // 2. Create consultation with current schema fields.
    // psychologistId is nullable, so request can be submitted before admin assignment.
    const consultationDate = new Date(date)
    const consultationTime = new Date(`1970-01-01T${time}`)

    if (Number.isNaN(consultationDate.getTime()) || Number.isNaN(consultationTime.getTime())) {
      return { success: false, error: "Invalid date or time format." }
    }

    await prisma.consultation.create({
      data: {
        userId: session.user.id,
        psychologistId: psych?.id ?? null,
        title,
        category: nature,
        description,
        date: consultationDate,
        time: consultationTime,
        isAnonymous,
        status: "SCHEDULED",
      }
    })

    // 3. Keep report creation so request is still tracked in reporting module.
    await prisma.report.create({
      data: {
        userId: session.user.id,
        title,
        description: `[${nature}] [Scheduled: ${date} at ${time}] ${description}`,
        location: "Online Consultation",
        status: "PENDING",
        isAnonymous,
        isPublic: false
      }
    })

    return { success: true, message: "Consultation requested successfully!" }
  } catch (error: any) {
    console.error("Failed to submit consultation form:", error)
    return { success: false, error: "An unexpected error occurred. Please try again." }
  }
}
