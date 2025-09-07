import { useCurrentAccount, useSuiClient } from "@mysten/dapp-kit";
import { useQuery } from "@tanstack/react-query";

import { MODULE_NAME, PACKAGE_ID } from "@/constants/contract";

export type FriendEntry = { alias: string; addr: string };
export type FriendList = { id: string; friends: FriendEntry[] };

export const queryKeyFriendList = (address?: string) =>
  address ? ["friend-list", address] : ["friend-list"];

export function useQueryFriendList() {
  const currentAccount = useCurrentAccount();
  const suiClient = useSuiClient();

  return useQuery({
    queryKey: queryKeyFriendList(currentAccount?.address),
    queryFn: async (): Promise<FriendList | null> => {
      if (!currentAccount) throw new Error("No connected account");

      const res = await suiClient.getOwnedObjects({
        owner: currentAccount.address,
        filter: { StructType: `${PACKAGE_ID}::${MODULE_NAME}::FriendList` },
        options: { showContent: true },
      });
      if (res.data.length === 0) return null;

      const obj = res.data[0];
      const content = (obj.data as any)?.content;
      if (!content || content.dataType !== "moveObject") return null;
      const fields = content.fields as any;
      const rawFriends: any[] = (fields.friends as any[]) ?? [];
      const friends: FriendEntry[] = rawFriends.map((it) => {
        const f = (it && (it as any).fields) ? (it as any).fields : it;
        return { alias: String(f.alias ?? ""), addr: String(f.addr ?? "") };
      });

      const list: FriendList = { id: String(fields.id.id), friends };
      return list;
    },
    enabled: !!currentAccount,
  });
}
