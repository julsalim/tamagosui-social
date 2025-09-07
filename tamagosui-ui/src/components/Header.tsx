import { ConnectButton } from "@mysten/dapp-kit";
import { Link } from "react-router-dom";
import { Button } from "./ui/button";

export default function Header() {
  return (
    <header className="fixed top-0 left-0 right-0 z-10 bg-background/80 backdrop-blur-sm border-b">
      <div className="container mx-auto flex h-16 items-center justify-between px-4">
        <div className="flex items-center gap-6">
          <Link to="/" className="text-2xl font-bold tracking-tighter">TAMAGOSUI</Link>
          <nav className="hidden md:flex items-center gap-2">
            <Button asChild>
              <Link to="/marketplace">Open Marketplace</Link>
            </Button>
          </nav>
        </div>
        <ConnectButton />
      </div>
    </header>
  );
}
