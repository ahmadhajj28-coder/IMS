import { MovementType } from '@prisma/client';
import { prisma } from './prisma';

type AdjustOptions = {
  productId: number;
  lotId?: number;
  type: MovementType;
  quantity: number;
  reason?: string;
  reference?: string;
  movementDate: Date;
};

export async function recordStockMovement(opts: AdjustOptions) {
  const { productId, lotId, type, quantity, reason, reference, movementDate } =
    opts;

  const product = await prisma.product.findUnique({ where: { id: productId } });
  if (!product) throw new Error('Product not found');

  const delta = type === 'IN' ? quantity : type === 'OUT' ? -quantity : 0;
  const newQty = type === 'ADJUST' ? quantity : product.quantity + delta;

  if (newQty < 0) throw new Error('Resulting quantity cannot be negative');

  const previousQty = product.quantity;

  return prisma.$transaction(async (tx) => {
    const updatedProduct = await tx.product.update({
      where: { id: productId },
      data: { quantity: newQty },
    });

    let lot = null;
    if (lotId) {
      const existingLot = await tx.lot.findUnique({ where: { id: lotId } });
      if (!existingLot) throw new Error('Lot not found');

      const lotDelta = type === 'IN' ? quantity : type === 'OUT' ? -quantity : 0;
      const lotNewQty =
        type === 'ADJUST' ? quantity : existingLot.quantity + lotDelta;
      if (lotNewQty < 0) throw new Error('Lot quantity cannot be negative');

      lot = await tx.lot.update({
        where: { id: lotId },
        data: { quantity: lotNewQty },
      });
    }

    const movement = await tx.stockMovement.create({
      data: {
        productId,
        lotId: lotId ?? null,
        type,
        quantity,
        reason,
        reference,
        movementDate,
        previousQty,
        newQty,
      },
    });

    return { product: updatedProduct, lot, movement };
  });
}

