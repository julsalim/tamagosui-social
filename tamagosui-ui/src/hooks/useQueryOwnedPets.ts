import { useCurrentAccount, useSuiClient } from "@mysten/dapp-kit";
import { useQuery } from "@tanstack/react-query";

import { MODULE_NAME, PACKAGE_ID } from "@/constants/contract";
import { normalizeSuiPetObject } from "@/lib/utils";
import type { PetStruct } from "@/types/Pet";

export const queryKeyOwnedPets = (address?: string) =>
  address ? ["owned-pets", address] : ["owned-pets"];

export function useQueryOwnedPets() {
  const currentAccount = useCurrentAccount();
  const suiClient = useSuiClient();

  return useQuery({
    queryKey: queryKeyOwnedPets(currentAccount?.address),
    queryFn: async (): Promise<PetStruct[]> => {
      if (!currentAccount) throw new Error("No connected account");
      const res = await suiClient.getOwnedObjects({
        owner: currentAccount.address,
        filter: { StructType: `${PACKAGE_ID}::${MODULE_NAME}::Pet` },
        options: { showContent: true },
      });
      if (res.data.length === 0) return [];

      const pets = res.data
        .map(normalizeSuiPetObject)
        .filter(Boolean) as PetStruct[];

      const withSleep = await Promise.all(
        pets.map(async (p) => {
          const dynamicFields = await suiClient.getDynamicFields({ parentId: p.id });
          const isSleeping = dynamicFields.data.some(
            (field) => field.name.type === "0x1::string::String" && field.name.value === "sleep_started_at",
          );
          return { ...p, isSleeping } as PetStruct;
        }),
      );

      return withSleep;
    },
    enabled: !!currentAccount,
  });
}
