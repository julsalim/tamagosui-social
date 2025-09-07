import { useState } from "react";
import { UsersIcon, PlusIcon, TrashIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";

import { useQueryFriendList } from "@/hooks/useQueryFriendList";
import { useMutateAddFriend, useMutateCreateFriendList, useMutateRemoveFriend } from "@/hooks/useMutateFriendList";

export default function FriendSidebar() {
  const { data: friendList, isPending } = useQueryFriendList();
  const { mutate: createList, isPending: creating } = useMutateCreateFriendList();
  const { mutate: addFriend, isPending: adding } = useMutateAddFriend();
  const { mutate: removeFriend, isPending: removing } = useMutateRemoveFriend();

  const [addr, setAddr] = useState("");
  const [alias, setAlias] = useState("");

  return (
    <Card className="w-72 border-2 border-primary shadow-hard">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-xl">
          <UsersIcon className="w-5 h-5" /> Friends
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        {isPending ? (
          <div>Loading...</div>
        ) : !friendList ? (
          <Button onClick={() => createList()} disabled={creating} className="w-full">
            Create Friend List
          </Button>
        ) : (
          <div className="space-y-3">
            <div className="flex gap-2">
              <Input placeholder="Alias" value={alias} onChange={(e) => setAlias(e.target.value)} />
              <Input placeholder="0x... address" value={addr} onChange={(e) => setAddr(e.target.value)} />
              <Button
                onClick={() => alias && addr && addFriend({ listId: friendList.id, alias, friendAddr: addr })}
                disabled={adding || !addr}
              >
                <PlusIcon className="w-4 h-4" />
              </Button>
            </div>
            <ul className="space-y-2 max-h-80 overflow-auto pr-1">
              {friendList.friends.length === 0 ? (
                <li className="text-muted-foreground">No friends yet.</li>
              ) : (
                friendList.friends.map((f) => (
                  <li key={f.addr} className="flex items-center justify-between gap-2 border p-2">
                    <div className="min-w-0">
                      <div className="font-medium truncate">{f.alias || f.addr}</div>
                      <div className="text-xs text-muted-foreground truncate">{f.addr}</div>
                    </div>
                    <Button
                      variant="destructive"
                      size="icon"
                      onClick={() => removeFriend({ listId: friendList.id, friendAddr: f.addr })}
                      disabled={removing}
                    >
                      <TrashIcon className="w-4 h-4" />
                    </Button>
                  </li>
                ))
              )}
            </ul>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
