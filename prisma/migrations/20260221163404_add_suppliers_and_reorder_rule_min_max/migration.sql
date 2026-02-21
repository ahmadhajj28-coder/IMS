/*
  Warnings:

  - You are about to drop the column `category` on the `ReorderRule` table. All the data in the column will be lost.
  - You are about to drop the column `supplier` on the `ReorderRule` table. All the data in the column will be lost.

*/
-- DropForeignKey
ALTER TABLE "ReorderRule" DROP CONSTRAINT "ReorderRule_productId_fkey";

-- DropIndex
DROP INDEX "ReorderRule_category_idx";

-- AlterTable
ALTER TABLE "ReorderRule" DROP COLUMN "category",
DROP COLUMN "supplier",
ADD COLUMN     "maxStock" INTEGER NOT NULL DEFAULT 9999,
ADD COLUMN     "supplierId" INTEGER;

-- CreateTable
CREATE TABLE "Supplier" (
    "id" SERIAL NOT NULL,
    "name" TEXT NOT NULL,
    "email" TEXT,
    "phone" TEXT,
    "address" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Supplier_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "ReorderRule_supplierId_idx" ON "ReorderRule"("supplierId");

-- AddForeignKey
ALTER TABLE "ReorderRule" ADD CONSTRAINT "ReorderRule_productId_fkey" FOREIGN KEY ("productId") REFERENCES "Product"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ReorderRule" ADD CONSTRAINT "ReorderRule_supplierId_fkey" FOREIGN KEY ("supplierId") REFERENCES "Supplier"("id") ON DELETE SET NULL ON UPDATE CASCADE;
