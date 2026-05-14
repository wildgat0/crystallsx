import { prisma } from "./prisma";

export async function getActiveBankAccount() {
  return prisma.bankAccount.findFirst({ where: { active: true } });
}

export async function handleRotationAfterConfirm(): Promise<boolean> {
  const thresholdCfg = await prisma.appConfig.findUnique({ where: { key: "rotation_threshold" } });
  const countCfg = await prisma.appConfig.findUnique({ where: { key: "orders_since_rotation" } });

  const threshold = parseInt(thresholdCfg?.value ?? "0");
  const current = parseInt(countCfg?.value ?? "0") + 1;

  // Update counter
  await prisma.appConfig.update({
    where: { key: "orders_since_rotation" },
    data: { value: String(current) },
  });

  // threshold = 0 means rotation is disabled
  if (threshold === 0 || current < threshold) return false;

  // Rotate: find next inactive account and activate it
  const currentAccount = await prisma.bankAccount.findFirst({ where: { active: true } });
  const nextAccount = await prisma.bankAccount.findFirst({
    where: { active: false, NOT: { id: currentAccount?.id } },
    orderBy: { createdAt: "asc" },
  });

  if (!nextAccount) return false; // No account to rotate to

  await prisma.$transaction([
    ...(currentAccount
      ? [prisma.bankAccount.update({ where: { id: currentAccount.id }, data: { active: false } })]
      : []),
    prisma.bankAccount.update({ where: { id: nextAccount.id }, data: { active: true } }),
    prisma.appConfig.update({ where: { key: "orders_since_rotation" }, data: { value: "0" } }),
  ]);

  return true;
}

export async function manualRotate(): Promise<{ success: boolean; message: string }> {
  const currentAccount = await prisma.bankAccount.findFirst({ where: { active: true } });
  const nextAccount = await prisma.bankAccount.findFirst({
    where: { active: false, NOT: { id: currentAccount?.id ?? "" } },
    orderBy: { createdAt: "asc" },
  });

  if (!nextAccount) return { success: false, message: "No hay cuentas inactivas disponibles para rotar." };

  await prisma.$transaction([
    ...(currentAccount
      ? [prisma.bankAccount.update({ where: { id: currentAccount.id }, data: { active: false } })]
      : []),
    prisma.bankAccount.update({ where: { id: nextAccount.id }, data: { active: true } }),
    prisma.appConfig.update({ where: { key: "orders_since_rotation" }, data: { value: "0" } }),
  ]);

  return { success: true, message: `Cuenta rotada a: ${nextAccount.bankName} — ${nextAccount.accountNumber}` };
}
