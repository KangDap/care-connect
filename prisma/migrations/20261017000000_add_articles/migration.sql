-- CreateEnum
CREATE TYPE "ArticleStatus" AS ENUM ('DRAFT', 'PUBLISHED');

-- CreateTable
CREATE TABLE "article_categories" (
    "category_id" SERIAL NOT NULL,
    "name" VARCHAR(100) NOT NULL,
    "description" VARCHAR(1000),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "article_categories_pkey" PRIMARY KEY ("category_id")
);

CREATE TABLE "articles" (
    "article_id" SERIAL NOT NULL,
    "title" VARCHAR(255) NOT NULL,
    "summary" VARCHAR(1000) NOT NULL,
    "content" TEXT NOT NULL,
    "category_id" INTEGER NOT NULL,
    "image_url" TEXT,
    "cta_text" VARCHAR(255) NOT NULL,
    "course_url" TEXT NOT NULL,
    "status" "ArticleStatus" NOT NULL DEFAULT 'DRAFT',
    "published_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "articles_pkey" PRIMARY KEY ("article_id")
);

CREATE UNIQUE INDEX "article_categories_name_key" ON "article_categories"("name");
CREATE INDEX "articles_category_id_idx" ON "articles"("category_id");
CREATE INDEX "articles_status_published_at_article_id_idx" ON "articles"("status", "published_at", "article_id");
CREATE INDEX "articles_created_at_article_id_idx" ON "articles"("created_at", "article_id");

-- Restrict deletion even when another request links an article concurrently.
ALTER TABLE "articles" ADD CONSTRAINT "articles_category_id_fkey"
FOREIGN KEY ("category_id") REFERENCES "article_categories"("category_id") ON DELETE RESTRICT ON UPDATE CASCADE;
