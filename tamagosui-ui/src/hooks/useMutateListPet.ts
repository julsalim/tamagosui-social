import { useCurrentAccount } from "@mysten/dapp-kit";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Transaction } from "@mysten/sui/transactions";
import { toast } from "sonner";
import { useSignAndExecuteTransaction, useSuiClient } from "@mysten/dapp-kit";

import { MARKETPLACE_ID, MODULE_NAME, PACKAGE_ID } from "@/constants/contract";
import { queryKeyOwnedPets } from "./useQueryOwnedPets";

export function useMutateListPet() {
  const currentAccount = useCurrentAccount();
  const { mutateAsync: signAndExecute } = useSignAndExecuteTransaction();
  const suiClient = useSuiClient();
  const queryClient = useQueryClient();

  return useMutation({
    mutationKey: ["mutate", "list-pet"],
    mutationFn: async ({ petId, priceMist }: { petId: string; priceMist: bigint }) => {
      if (!currentAccount) throw new Error("No connected account");
      const tx = new Transaction();
      tx.moveCall({
        target: `${PACKAGE_ID}::${MODULE_NAME}::list_pet`,
        arguments: [tx.object(MARKETPLACE_ID), tx.object(petId), tx.pure.u64(Number(priceMist))],
      });
      const result = await signAndExecute({ transaction: tx });
      const response = await suiClient.waitForTransaction({ digest: result.digest });
      if (response?.effects?.status.status === "failure") throw new Error(response.effects.status.error);
      return response;
    },
    onSuccess: () => {
      toast.success("Pet listed");
      queryClient.invalidateQueries({ queryKey: queryKeyOwnedPets() });
    },
    onError: (err: any) => toast.error(err.message || "Failed to list pet"),
  });
}
