import { useCurrentAccount, useSignAndExecuteTransaction, useSuiClient } from "@mysten/dapp-kit";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Transaction } from "@mysten/sui/transactions";
import { toast } from "sonner";
import { CLOCK_ID, MARKETPLACE_ID, MODULE_NAME, PACKAGE_ID } from "@/constants/contract";
import { queryKeyOwnedPets } from "./useQueryOwnedPets";

export function useMutateBuySuperPet() {
  const currentAccount = useCurrentAccount();
  const { mutateAsync: signAndExecute } = useSignAndExecuteTransaction();
  const suiClient = useSuiClient();
  const queryClient = useQueryClient();

  return useMutation({
    mutationKey: ["mutate", "buy-super-pet"],
    mutationFn: async ({ priceMist }: { priceMist: bigint }) => {
      if (!currentAccount) throw new Error("No connected account");
      const tx = new Transaction();
      const [payment] = tx.splitCoins(tx.gas, [tx.pure.u64(Number(priceMist))]);
      tx.moveCall({
        target: `${PACKAGE_ID}::${MODULE_NAME}::buy_super_pet`,
        arguments: [tx.object(MARKETPLACE_ID), payment, tx.object(CLOCK_ID)],
      });
      const result = await signAndExecute({ transaction: tx });
      const response = await suiClient.waitForTransaction({ digest: result.digest });
      if (response?.effects?.status.status === "failure") throw new Error(response.effects.status.error);
      return response;
    },
    onSuccess: () => {
      toast.success("Bought super pet");
      queryClient.invalidateQueries({ queryKey: queryKeyOwnedPets() });
    },
    onError: (e: any) => toast.error(e.message ?? "Failed to buy super pet"),
  });
}
