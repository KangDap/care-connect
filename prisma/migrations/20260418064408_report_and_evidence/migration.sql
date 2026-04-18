/*
  Warnings:

  - You are about to drop the column `location` on the `reports` table. All the data in the column will be lost.
  - You are about to drop the column `timestamp` on the `reports` table. All the data in the column will be lost.
  - Added the required column `category` to the `reports` table without a default value. This is not possible if the table is not empty.
  - Added the required column `city` to the `reports` table without a default value. This is not possible if the table is not empty.
  - Added the required column `district` to the `reports` table without a default value. This is not possible if the table is not empty.
  - Added the required column `incident_date` to the `reports` table without a default value. This is not possible if the table is not empty.
  - Added the required column `province` to the `reports` table without a default value. This is not possible if the table is not empty.
  - Added the required column `updated_at` to the `reports` table without a default value. This is not possible if the table is not empty.

*/
-- CreateEnum
CREATE TYPE "ReportCategory" AS ENUM ('PHYSICAL', 'SEXUAL', 'PSYCHOLOGICAL', 'OTHER');

-- AlterTable
ALTER TABLE "reports" DROP COLUMN "location",
DROP COLUMN "timestamp",
ADD COLUMN     "address" VARCHAR(255),
ADD COLUMN     "category" "ReportCategory" NOT NULL,
ADD COLUMN     "city" VARCHAR(120) NOT NULL,
ADD COLUMN     "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
ADD COLUMN     "district" VARCHAR(120) NOT NULL,
ADD COLUMN     "incident_date" DATE NOT NULL,
ADD COLUMN     "province" VARCHAR(120) NOT NULL,
ADD COLUMN     "updated_at" TIMESTAMP(3) NOT NULL,
ALTER COLUMN "description" SET DATA TYPE TEXT,
ALTER COLUMN "status" SET DEFAULT 'PENDING';

-- CreateTable
CREATE TABLE "report_evidences" (
    "evidence_id" SERIAL NOT NULL,
    "report_id" INTEGER NOT NULL,
    "file_name" VARCHAR(255) NOT NULL,
    "file_url" TEXT NOT NULL,
    "mime_type" VARCHAR(120) NOT NULL,
    "file_size" INTEGER NOT NULL,
    "uploaded_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "report_evidences_pkey" PRIMARY KEY ("evidence_id")
);

-- CreateIndex
CREATE INDEX "report_evidences_report_id_idx" ON "report_evidences"("report_id");

-- CreateIndex
CREATE INDEX "reports_user_id_idx" ON "reports"("user_id");

-- CreateIndex
CREATE INDEX "reports_status_idx" ON "reports"("status");

-- CreateIndex
CREATE INDEX "reports_incident_date_idx" ON "reports"("incident_date");

-- CreateIndex
CREATE INDEX "reports_is_public_status_idx" ON "reports"("is_public", "status");

-- CreateIndex
CREATE INDEX "reports_category_idx" ON "reports"("category");

-- AddForeignKey
ALTER TABLE "report_evidences" ADD CONSTRAINT "report_evidences_report_id_fkey" FOREIGN KEY ("report_id") REFERENCES "reports"("report_id") ON DELETE CASCADE ON UPDATE CASCADE;
