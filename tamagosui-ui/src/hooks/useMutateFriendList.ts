import {
  useCurrentAccount,
  useSignAndExecuteTransaction,
  useSuiClient,
} from "@mysten/dapp-kit";
import { Transaction } from "@mysten/sui/transactions";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";

import { MODULE_NAME, PACKAGE_ID } from "@/constants/contract";
import { queryKeyFriendList } from "./useQueryFriendList";

export function useMutateCreateFriendList() {
  const currentAccount = useCurrentAccount();
  const { mutateAsync: signAndExecute } = useSignAndExecuteTransaction();
  const suiClient = useSuiClient();
  const queryClient = useQueryClient();

  return useMutation({
    mutationKey: ["mutate", "create-friend-list"],
    mutationFn: async () => {
      if (!currentAccount) throw new Error("No connected account");
      const tx = new Transaction();
      tx.moveCall({ target: `${PACKAGE_ID}::${MODULE_NAME}::create_friend_list` });
      const { digest } = await signAndExecute({ transaction: tx });
      const res = await suiClient.waitForTransaction({ digest });
      return res;
    },
    onSuccess: (res) => {
      toast.success(`Friend list created: ${res.digest}`);
      queryClient.invalidateQueries({ queryKey: queryKeyFriendList() });
    },
    onError: (err: any) => toast.error(err.message ?? String(err)),
  });
}

export function useMutateAddFriend() {
  const currentAccount = useCurrentAccount();
  const { mutateAsync: signAndExecute } = useSignAndExecuteTransaction();
  const suiClient = useSuiClient();
  const queryClient = useQueryClient();

  return useMutation({
    mutationKey: ["mutate", "add-friend"],
  mutationFn: async ({ listId, alias, friendAddr }: { listId: string; alias: string; friendAddr: string }) => {
      if (!currentAccount) throw new Error("No connected account");
      const tx = new Transaction();
      tx.moveCall({
        target: `${PACKAGE_ID}::${MODULE_NAME}::add_friend`,
        arguments: [tx.object(listId), tx.pure.string(alias), tx.pure.address(friendAddr)],
      });
      const { digest } = await signAndExecute({ transaction: tx });
      const res = await suiClient.waitForTransaction({ digest });
      return res;
    },
    onSuccess: (res) => {
      toast.success(`Friend added: ${res.digest}`);
      queryClient.invalidateQueries({ queryKey: queryKeyFriendList() });
    },
    onError: (err: any) => toast.error(err.message ?? String(err)),
  });
}

export function useMutateRemoveFriend() {
  const currentAccount = useCurrentAccount();
  const { mutateAsync: signAndExecute } = useSignAndExecuteTransaction();
  const suiClient = useSuiClient();
  const queryClient = useQueryClient();

  return useMutation({
    mutationKey: ["mutate", "remove-friend"],
    mutationFn: async ({ listId, friendAddr }: { listId: string; friendAddr: string }) => {
      if (!currentAccount) throw new Error("No connected account");
      const tx = new Transaction();
      tx.moveCall({
        target: `${PACKAGE_ID}::${MODULE_NAME}::remove_friend`,
        arguments: [tx.object(listId), tx.pure.address(friendAddr)],
      });
      const { digest } = await signAndExecute({ transaction: tx });
      const res = await suiClient.waitForTransaction({ digest });
      return res;
    },
    onSuccess: (res) => {
      toast.success(`Friend removed: ${res.digest}`);
      queryClient.invalidateQueries({ queryKey: queryKeyFriendList() });
    },
    onError: (err: any) => toast.error(err.message ?? String(err)),
  });
}
