"use server"

import { prisma } from "@/lib/prisma"
import { auth } from "@/lib/auth"
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

    // 1. Create the Report for the consultation request
    const report = await prisma.report.create({
      data: {
        userId: session.user.id,
        title: title,
        description: `[${nature}] [Scheduled: ${date} at ${time}] ${description}`,
        location: "Online Consultation", // Default value
        status: "PENDING",
        isAnonymous: isAnonymous,
        isPublic: false
      }
    })

    // 2. Try to find an available Psychologist
    const psych = await prisma.user.findFirst({
      where: { role: "PSYCHOLOGIST" }
    })

    // If psychologist found, create Consultation immediately
    if (psych) {
      await prisma.consultation.create({
        data: {
          userId: session.user.id,
          psychologistId: psych.id,
          reportId: report.id,
          lastConsult: new Date(),
          status: "SCHEDULED",
          note: "Initial consultation request"
        }
      })
    }

    return { success: true, message: "Consultation requested successfully!" }
  } catch (error: any) {
    console.error("Failed to submit consultation form:", error)
    return { success: false, error: "An unexpected error occurred. Please try again." }
  }
}
