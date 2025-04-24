"use client";

import { NavigationBar } from "@/components/Navbar";
import { useQueryContext } from "@/contexts/QueryProvider";
import { useUserContext } from "@/contexts/UserProvider";
import { Tables } from "@/types/database.types";
import { Button } from "@heroui/button";
import { Textarea } from "@heroui/input";
import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";


export default function Game() {
  const [deck, setDeck] = useState<Tables<"decks"> | undefined>(undefined);
  const [gameInfo, setGameInfo] = useState<Tables<"games"> | undefined>(undefined);
  const [gameUuid, setGameUuid] = useState<string | null>(null);
  const [currentCardIndex, setCurrentCardIndex] = useState<number>(0);
  const [showFront, setShowFront] = useState<boolean>(true);
  const [gameFinished, setGameFinished] = useState<boolean>(false);

  const searchParams = useSearchParams();
  const query = useQueryContext();
  const session = useUserContext();
  const router = useRouter();

  const loadGameFromUuid = async () => {
    if (!gameUuid) return;
    query?.getGameById(gameUuid).then((game: any) => {
      setGameInfo(game[0]);

      query?.getDeckById(game[0]["deck"]).then((deck: any) => {
        setDeck(deck[0]);
        console.log(deck[0]);
      });

    })

  }

  const handleFlip = () => {
    if (currentCardIndex === deck?.cards?.length) {
      setGameFinished(true);
      return;
    }
    if (showFront) { setShowFront(false) }
    if (!showFront) {
      setShowFront(true);
      setCurrentCardIndex(currentCardIndex + 1)
    }
  }

  const handleGameEnd = () => {
    if (gameUuid) {
      query?.deleteGameById(gameUuid);
    }
    router.push("/");
  }

  const handleGameRestart = () => {
    setCurrentCardIndex(0);
    setGameFinished(false);
  }

  useEffect(() => {
    if (!gameUuid) return;
    loadGameFromUuid();
  }, [gameUuid])

  useEffect(() => {
    console.log("test")
    const param = searchParams.get("id");
    setGameUuid(param);
  }, [session?.user?.id, query])

  useEffect(() => {
    session?.getSessionData();
  })

  if (!gameUuid) return (
    <div className="min-h-screen flex flex-col">
      <NavigationBar />

      <p>There was a problem loading this deck.</p>

    </div>
  )

  return (
    <div className="min-h-screen flex flex-col">
      <NavigationBar />

      <div className="flex flex-col items-center">
        <h2 className="text-xl font-bold mb-4 text-center">{gameInfo?.name}</h2>

        <div className="max-w-sm">
          <Button
            variant="ghost"
            size="lg"
            onPress={() => handleFlip()}
            isDisabled={gameFinished}
          >Flip</Button>
        </div>
        <>
          {
            deck?.cards?.at(currentCardIndex) && (
              <div className="mt-2 w-5/6 h-5/6">
                {showFront ? (
                  <Textarea
                    value={deck?.cards?.at(currentCardIndex)["front"]}
                    className="w-full h-full"
                    labelPlacement="outside"
                    variant="bordered"
                    isReadOnly
                  />
                ) : (
                  <Textarea
                    value={deck?.cards?.at(currentCardIndex)["back"]}
                    className="w-full h-full"
                    labelPlacement="outside"
                    isReadOnly
                  />
                )}
              </div>
            )
          }
          {gameFinished && (
            <div className="flex flex-col gap-2 mt-2">
              <p className="text-center">Game finished!</p>
              <div className="flex flex-row gap-2">
                <Button
                  variant="ghost"
                  onPress={() => handleGameEnd()}
                >Return to home</Button>
                <Button
                  variant="ghost"
                  onPress={() => handleGameRestart()}
                >Restart</Button>
              </div>
            </div>
          )}
        </>

      </div>

    </div>
  )
}
