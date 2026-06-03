-- DropForeignKey
ALTER TABLE "Ticket" DROP CONSTRAINT "Ticket_columnId_fkey";

-- AddForeignKey
ALTER TABLE "Ticket" ADD CONSTRAINT "Ticket_columnId_fkey" FOREIGN KEY ("columnId") REFERENCES "BoardColumn"("id") ON DELETE NO ACTION ON UPDATE CASCADE;
