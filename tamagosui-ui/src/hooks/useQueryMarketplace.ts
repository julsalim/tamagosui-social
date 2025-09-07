import { useSuiClient } from "@mysten/dapp-kit";
import { useQuery } from "@tanstack/react-query";
import { MARKETPLACE_ID, MODULE_NAME } from "@/constants/contract";

export type PetListing = {
  objectId: string; // dynamic field object id
  petId: string;
  seller: string;
  priceMist: bigint;
  petName: string;
  petImageUrl: string;
};

export type ShopItem = {
  name: string;
  imageUrl: string;
  priceMist: bigint;
  stock: number;
};

export function useQueryMarketplace() {
  const suiClient = useSuiClient();

  return useQuery({
    queryKey: ["marketplace", MARKETPLACE_ID],
    queryFn: async () => {
      // Fetch dynamic fields under Marketplace
      const fields = await suiClient.getDynamicFields({ parentId: MARKETPLACE_ID });

      const listings: PetListing[] = [];
      let shop: ShopItem | null = null;
      for (const f of fields.data) {
        const df = await suiClient.getDynamicFieldObject({ parentId: MARKETPLACE_ID, name: f.name });
        const content: any = df.data?.content;
        if (content?.dataType !== "moveObject") continue;
        const typeStr: string = content.type;
        // Dynamic field wrapper type: 0x2::dynamic_field::Field<Key, Value>
        if (!typeStr.startsWith("0x2::dynamic_field::Field<")) continue;
        // Extract the inner value which holds our actual struct fields
        const inner = content.fields?.value?.fields;
        if (!inner) continue;
        if (typeStr.includes(`::${MODULE_NAME}::PetListing>`)) {
          listings.push({
            objectId: (df.data as any).objectId,
            petId: inner.pet.fields.id.id,
            seller: inner.seller,
            priceMist: BigInt(inner.price),
            petName: inner.pet.fields.name,
            petImageUrl: inner.pet.fields.image_url,
          });
        } else if (typeStr.includes(`::${MODULE_NAME}::ShopListing>`)) {
          shop = {
            name: inner.name,
            imageUrl: inner.image_url,
            priceMist: BigInt(inner.price),
            stock: Number(inner.stock),
          };
        }
      }

      return { listings, shop };
    },
  });
}
