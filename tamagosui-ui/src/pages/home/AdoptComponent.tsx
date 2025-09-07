import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { useMutateAdoptPet } from "@/hooks/useMutateAdoptPet";
import { Loader2Icon } from "lucide-react";

const IMAGE_CHOICES = [
  "https://media.tenor.com/gSl1GTJY-NcAAAAM/rhobh-cat.gif",
  "https://media3.giphy.com/media/v1.Y2lkPTZjMDliOTUya2U5ODF3bDFmZ2o4YjJuYmc0a3Q2MGtyNDNkaDU3dHZ6ZzczOXJvYiZlcD12MV9naWZzX3NlYXJjaCZjdD1n/9EP5BndVp9W4AsBcz7/giphy.gif",
  "https://media.tenor.com/CGIHMXu6m_4AAAAM/funny.gif",
  "https://i.pinimg.com/originals/c5/ee/51/c5ee5152fd8575cd966fa258addca1a1.gif",
  "https://i.pinimg.com/originals/6c/95/c6/6c95c607ac6f8fe776fe6a7068cef76e.gif"
];

export default function AdoptComponent() {
  const [petName, setPetName] = useState("");
  const [imageUrl, setImageUrl] = useState<string>(IMAGE_CHOICES[0]);
  const { mutate: mutateAdoptPet, isPending: isAdopting } = useMutateAdoptPet();

  const handleAdoptPet = () => {
    if (!petName.trim() || !imageUrl) return;
    mutateAdoptPet({ name: petName, imageUrl });
  };

  return (
    <Card className="w-full max-w-sm text-center shadow-hard border-2 border-primary">
      <CardHeader>
        <CardTitle className="text-3xl">ADOPT YOUR PET</CardTitle>
        <CardDescription>A new friend awaits!</CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="space-y-2">
          <img
            src={imageUrl}
            alt="Your new pet"
            className="w-40 h-40 mx-auto image-rendering-pixelated bg-secondary p-2 border-2 border-primary"
          />
          <div className="grid grid-cols-3 gap-2">
            {IMAGE_CHOICES.map((url) => (
              <button
                key={url}
                onClick={() => setImageUrl(url)}
                className={`border ${imageUrl === url ? "ring-2 ring-primary" : ""}`}
                title={url}
              >
                <img src={url} className="w-full h-16 object-cover" />
              </button>
            ))}
          </div>
        </div>

        <div className="space-y-2">
          <p className="text-lg">What will you name it?</p>
          <Input
            value={petName}
            onChange={(e) => setPetName(e.target.value)}
            placeholder="Enter pet's name"
            disabled={isAdopting}
            className="text-center text-lg border-2 border-primary focus:ring-2 focus:ring-offset-2 focus:ring-ring"
          />
        </div>

        <div>
          <Button
            onClick={handleAdoptPet}
            disabled={!petName.trim() || !imageUrl || isAdopting}
            className="w-full text-lg py-6 border-2 border-primary shadow-hard-sm hover:translate-x-0.5 hover:translate-y-0.5"
          >
            {isAdopting ? (
              <>
                <Loader2Icon className="mr-2 h-5 w-5 animate-spin" />{" "}
                Adopting...
              </>
            ) : (
              "ADOPT NOW"
            )}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
