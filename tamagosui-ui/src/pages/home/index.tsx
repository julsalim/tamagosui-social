import { useQueryOwnedPet } from "@/hooks/useQueryOwnedPet";
import { useQueryOwnedPets } from "@/hooks/useQueryOwnedPets";
import { useCurrentAccount } from "@mysten/dapp-kit";
import { useEffect, useMemo, useState } from "react";
import AdoptComponent from "./AdoptComponent";
import PetComponent from "./PetComponent";
import Header from "@/components/Header";
import FriendSidebar from "@/components/FriendSidebar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { BatteryIcon, DrumstickIcon, HeartIcon, CoinsIcon } from "lucide-react";
import { useMutateAdoptPet } from "@/hooks/useMutateAdoptPet";

export default function HomePage() {
  const currentAccount = useCurrentAccount();
  const { data: ownedPet, isPending: isOwnedPetLoading } = useQueryOwnedPet();
  const { data: ownedPets, isPending: isOwnedPetsLoading } = useQueryOwnedPets();
  const [selectedId, setSelectedId] = useState<string>("");
  const [newPetName, setNewPetName] = useState("");
  const [newPetImage, setNewPetImage] = useState<string>("https://media.tenor.com/gSl1GTJY-NcAAAAM/rhobh-cat.gif");
  const { mutate: adoptPet, isPending: isAdopting } = useMutateAdoptPet();

  // Initialize or reconcile selection when data changes
  useEffect(() => {
    const first = ownedPet?.id ?? ownedPets?.[0]?.id ?? "";
    if (!selectedId && first) setSelectedId(first);
    else if (selectedId && ownedPets && !ownedPets.some((p) => p.id === selectedId)) {
      setSelectedId(first);
    }
  }, [ownedPet?.id, ownedPets, selectedId]);

  const selected = useMemo(() => {
    if (!ownedPets || ownedPets.length === 0) return undefined;
    return ownedPets.find((p) => p.id === selectedId) ?? ownedPets[0];
  }, [ownedPets, selectedId]);

  return (
    <div className="min-h-screen flex flex-col bg-secondary">
      <Header />
      <main className="flex-grow flex items-start justify-center gap-6 p-4 pt-24">
        <div className="hidden md:block sticky top-24 self-start"><FriendSidebar /></div>
        {!currentAccount ? (
          <div className="text-center p-8 border-4 border-primary bg-background shadow-[8px_8px_0px_#000]">
            <h2 className="text-4xl uppercase">Please Connect Wallet</h2>
          </div>
        ) : isOwnedPetLoading || isOwnedPetsLoading ? (
          <div className="text-center p-8 border-4 border-primary bg-background shadow-[8px_8px_0px_#000]">
            <h2 className="text-4xl uppercase">Loading Pet...</h2>
          </div>
        ) : selected ? (
          <div className="flex flex-col md:flex-row gap-6 items-start">
            {/* Left column */}
            <div className="md:w-80 w-full space-y-4">
              {/* Adopt another pet */}
              <Card className="border-2 border-primary shadow-hard">
                <CardHeader>
                  <CardTitle className="text-lg">Adopt another pet</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="flex gap-2">
                    <Input
                      value={newPetName}
                      onChange={(e) => setNewPetName(e.target.value)}
                      placeholder="Name"
                    />
                    <Button
                      onClick={() => newPetName.trim() && adoptPet({ name: newPetName.trim(), imageUrl: newPetImage })}
                      disabled={isAdopting || !newPetName.trim()}
                    >
                      {isAdopting ? "Adopting..." : "Adopt"}
                    </Button>
                  </div>
                  <div className="grid grid-cols-3 gap-2">
                    {[
                      "https://media.tenor.com/gSl1GTJY-NcAAAAM/rhobh-cat.gif",
                      "https://media3.giphy.com/media/v1.Y2lkPTZjMDliOTUya2U5ODF3bDFmZ2o4YjJuYmc0a3Q2MGtyNDNkaDU3dHZ6ZzczOXJvYiZlcD12MV9naWZzX3NlYXJjaCZjdD1n/9EP5BndVp9W4AsBcz7/giphy.gif",
                      "https://media.tenor.com/CGIHMXu6m_4AAAAM/funny.gif",
                      "https://i.pinimg.com/originals/c5/ee/51/c5ee5152fd8575cd966fa258addca1a1.gif",
                      "https://i.pinimg.com/originals/6c/95/c6/6c95c607ac6f8fe776fe6a7068cef76e.gif",
                    ].map((url) => (
                      <button
                        key={url}
                        onClick={() => setNewPetImage(url)}
                        className={`border rounded-md overflow-hidden ${newPetImage === url ? "ring-2 ring-primary" : ""}`}
                        title={url}
                      >
                        <img src={url} className="w-full h-16 object-cover" />
                      </button>
                    ))}
                  </div>
                </CardContent>
              </Card>

              {/* Your Pets list */}
              <Card className="border-2 border-primary shadow-hard">
                <CardHeader>
                  <CardTitle className="text-lg">Your Pets ({ownedPets?.length ?? 0})</CardTitle>
                </CardHeader>
                <CardContent className="space-y-2">
                  {(ownedPets ?? []).length === 0 ? (
                    <div className="text-sm text-muted-foreground">You don't have any pets yet.</div>
                  ) : (
                    (ownedPets ?? []).map((p) => {
                      const isSelected = selected?.id === p.id;
                      return (
                        <button
                          key={p.id}
                          onClick={() => setSelectedId(p.id)}
                          className={`w-full rounded-lg border p-2 text-left transition hover:bg-accent/50 ${
                            isSelected ? "bg-accent border-primary" : "bg-background"
                          }`}
                        >
                          <div className="flex items-center gap-3">
                            <img
                              src={p.image_url}
                              alt={p.name}
                              className="w-12 h-12 rounded-md object-cover border"
                            />
                            <div className="min-w-0 flex-1">
                              <div className="flex items-center justify-between gap-2">
                                <div className="font-semibold truncate">{p.name}</div>
                                <div className="flex items-center gap-1 text-xs text-muted-foreground">
                                  <CoinsIcon className="w-3.5 h-3.5 text-yellow-500" />
                                  {p.game_data.coins}
                                </div>
                              </div>
                              <div className="text-xs text-muted-foreground">Lv {p.game_data.level}</div>
                              {/* mini preview bars */}
                              <div className="mt-1 grid grid-cols-3 gap-2">
                                <div className="flex items-center gap-1">
                                  <BatteryIcon className="w-3.5 h-3.5 text-green-500" />
                                  <Progress value={p.stats.energy} className="h-1.5 flex-1 [&>[data-slot=progress-indicator]]:bg-green-500" />
                                </div>
                                <div className="flex items-center gap-1">
                                  <HeartIcon className="w-3.5 h-3.5 text-pink-500" />
                                  <Progress value={p.stats.happiness} className="h-1.5 flex-1 [&>[data-slot=progress-indicator]]:bg-pink-500" />
                                </div>
                                <div className="flex items-center gap-1">
                                  <DrumstickIcon className="w-3.5 h-3.5 text-orange-500" />
                                  <Progress value={p.stats.hunger} className="h-1.5 flex-1 [&>[data-slot=progress-indicator]]:bg-orange-500" />
                                </div>
                              </div>
                            </div>
                          </div>
                        </button>
                      );
                    })
                  )}
                </CardContent>
              </Card>
            </div>
            {/* Selected */}
            <PetComponent pet={selected} />
          </div>
        ) : (
          <AdoptComponent />
        )}
      </main>
    </div>
  );
}
