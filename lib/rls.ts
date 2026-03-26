import "server-only";
import type { Transaction } from "sequelize";
import { getSequelize } from "@/lib/sequelize";

export async function runAsUser<T>(
  userId: string,
  callback: (transaction: Transaction) => Promise<T>,
) {
  const sequelize = getSequelize();

  return sequelize.transaction(async (transaction) => {
    await sequelize.query("SELECT set_config('app.current_user_id', :userId, true)", {
      replacements: { userId },
      transaction,
    });

    return callback(transaction);
  });
}
