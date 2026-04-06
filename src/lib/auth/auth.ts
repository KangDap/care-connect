import { betterAuth } from "better-auth"
import { prismaAdapter } from "better-auth/adapters/prisma"
import { admin, openAPI } from "better-auth/plugins"
import { prisma } from "@/lib/prisma"

export const auth = betterAuth({
  database: prismaAdapter(prisma, {
    provider: "postgresql",
  }),
  user: {
    additionalFields: {
      role: {
        type: ["USER", "PSYCHOLOGIST", "ADMIN"],
        required: true,
        defaultValue: "USER",
        input: false,
      },
      bio: {
        type: "string",
        required: false,
      },
      dateOfBirth: {
        type: "date",
        required: false,
        fieldName: "date_of_birth",
      },
      gender: {
        type: ["MALE", "FEMALE", "OTHER", "PREFER_NOT_TO_SAY"],
        required: false,
        defaultValue: "PREFER_NOT_TO_SAY",
      },
      phoneNumber: {
        type: "string",
        required: false,
        fieldName: "phone_number",
      },
    },
  },
  emailAndPassword: {
    enabled: true,
  },
  plugins: [
    admin(),
    openAPI()
  ],
})

export type Session = typeof auth.$Infer.Session