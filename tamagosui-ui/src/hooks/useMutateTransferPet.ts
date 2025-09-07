import { useCurrentAccount, useSignAndExecuteTransaction, useSuiClient } from "@mysten/dapp-kit";
import { Transaction } from "@mysten/sui/transactions";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";

import { queryKeyOwnedPets } from "./useQueryOwnedPets";
import { queryKeyOwnedPet } from "./useQueryOwnedPet";

export function useMutateTransferPet() {
  const currentAccount = useCurrentAccount();
  const { mutateAsync: signAndExecute } = useSignAndExecuteTransaction();
  const suiClient = useSuiClient();
  const queryClient = useQueryClient();

  return useMutation({
    mutationKey: ["mutate", "transfer-pet"],
    mutationFn: async ({ petId, to }: { petId: string; to: string }) => {
      if (!currentAccount) throw new Error("No connected account");
      const tx = new Transaction();
      tx.transferObjects([tx.object(petId)], tx.pure.address(to));
      const { digest } = await signAndExecute({ transaction: tx });
      const res = await suiClient.waitForTransaction({ digest });
      return res;
    },
    onSuccess: (res) => {
      toast.success(`Pet transferred: ${res.digest}`);
  queryClient.invalidateQueries({ queryKey: queryKeyOwnedPets() });
  queryClient.invalidateQueries({ queryKey: queryKeyOwnedPet() });
    },
    onError: (err: any) => toast.error(err.message ?? String(err)),
  });
}
