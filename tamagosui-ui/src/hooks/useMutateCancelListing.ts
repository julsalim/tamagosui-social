import { useSignAndExecuteTransaction, useSuiClient } from "@mysten/dapp-kit";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Transaction } from "@mysten/sui/transactions";
import { toast } from "sonner";
import { MARKETPLACE_ID, MODULE_NAME, PACKAGE_ID } from "@/constants/contract";
import { queryKeyOwnedPets } from "./useQueryOwnedPets";

export function useMutateCancelListing() {
  const { mutateAsync: signAndExecute } = useSignAndExecuteTransaction();
  const suiClient = useSuiClient();
  const queryClient = useQueryClient();

  return useMutation({
    mutationKey: ["mutate", "cancel-listing"],
    mutationFn: async ({ petId }: { petId: string }) => {
      const tx = new Transaction();
      tx.moveCall({
        target: `${PACKAGE_ID}::${MODULE_NAME}::cancel_listing`,
        arguments: [tx.object(MARKETPLACE_ID), tx.pure.id(petId)],
      });
      const res = await signAndExecute({ transaction: tx });
      const response = await suiClient.waitForTransaction({ digest: res.digest });
      if (response?.effects?.status.status === "failure") throw new Error(response.effects.status.error);
      return response;
    },
    onSuccess: () => {
      toast.success("Listing canceled");
      queryClient.invalidateQueries();
      queryClient.invalidateQueries({ queryKey: queryKeyOwnedPets() });
    },
    onError: (e: any) => toast.error(e.message ?? "Failed to cancel listing"),
  });
}
