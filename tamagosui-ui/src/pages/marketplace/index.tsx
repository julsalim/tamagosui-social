import { useQueryMarketplace } from "@/hooks/useQueryMarketplace";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useMutateBuySuperPet } from "@/hooks/useMutateBuySuperPet";
import { MIST_PER_SUI } from "@/constants/contract";
import { useMutateBuyListedPet } from "@/hooks/useMutateBuyListedPet";
import { useNavigate } from "react-router-dom";
import { useCurrentAccount } from "@mysten/dapp-kit";
import { useMutateCancelListing } from "@/hooks/useMutateCancelListing";

export default function MarketplacePage() {
  const { data, isLoading, refetch } = useQueryMarketplace();
  const buyShop = useMutateBuySuperPet();
  const buyListing = useMutateBuyListedPet();
  const navigate = useNavigate();
  const current = useCurrentAccount();
  const cancelListing = useMutateCancelListing();

  if (isLoading) return <div className="container mx-auto p-4 pt-20">Loading marketplace...</div>;

  return (
    <div className="container mx-auto p-4 pt-20 space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold">Marketplace</h1>
        <Button variant="secondary" onClick={() => navigate(-1)}>Back</Button>
      </div>

      {data?.shop && (
        <Card>
          <CardHeader>
            <CardTitle>Super Pet (stock: {data.shop.stock})</CardTitle>
          </CardHeader>
          <CardContent className="flex items-center gap-4">
            <img src={data.shop.imageUrl} className="w-24 h-24 rounded object-cover" />
            <div className="flex-1">
              <div className="font-semibold">{data.shop.name}</div>
              <div className="text-sm text-muted-foreground">Price: {Number(data.shop.priceMist) / Number(MIST_PER_SUI)} SUI</div>
            </div>
            <Button
              disabled={data.shop.stock <= 0 || buyShop.isPending}
              onClick={async () => {
                await buyShop.mutateAsync({ priceMist: data.shop!.priceMist });
                refetch();
              }}
            >
              {buyShop.isPending ? "Buying..." : "Buy"}
            </Button>
          </CardContent>
        </Card>
      )}

      <div className="space-y-2">
        <h2 className="text-xl font-semibold">Listings</h2>
        {data?.listings?.length ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {data.listings.map((l) => (
              <Card key={l.petId}>
                <CardContent className="p-4 flex items-center gap-4">
                  <img src={l.petImageUrl} alt={l.petName} className="w-16 h-16 rounded object-cover border" />
                  <div className="flex-1 min-w-0">
                    <div className="font-semibold truncate">{l.petName}</div>
                    <div className="text-xs text-muted-foreground truncate">{l.petId}</div>
                    <div className="text-sm mt-1">Price: {Number(l.priceMist) / Number(MIST_PER_SUI)} SUI</div>
                  </div>
                  {current?.address?.toLowerCase() === l.seller.toLowerCase() ? (
                    <Button
                      variant="destructive"
                      onClick={() => cancelListing.mutate({ petId: l.petId })}
                      disabled={cancelListing.isPending}
                    >
                      {cancelListing.isPending ? "Canceling..." : "Cancel"}
                    </Button>
                  ) : (
                    <Button
                      onClick={() => buyListing.mutate({ petId: l.petId, priceMist: l.priceMist })}
                      disabled={buyListing.isPending}
                    >
                      {buyListing.isPending ? "Buying..." : "Buy"}
                    </Button>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>
        ) : (
          <div className="text-sm text-muted-foreground">No listings yet.</div>
        )}
      </div>
    </div>
  );
}
