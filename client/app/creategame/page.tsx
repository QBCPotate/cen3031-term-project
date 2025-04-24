"use client";
import { NavigationBar } from "@/components/Navbar";
import { Button, ButtonGroup } from "@heroui/button";
import { Select, SelectItem } from "@heroui/select";
import { NumberInput } from "@heroui/number-input";
import { useEffect, useState } from "react";
import { Input, Textarea } from "@heroui/input";
import { useUserContext } from "@/contexts/UserProvider";
import { useQueryContext } from "@/contexts/QueryProvider";
import { Tables } from "@/types/database.types";
import { useRouter, useSearchParams } from "next/navigation";
import { v4 as uuid } from 'uuid';

export default function CreateGame() {

  const router = useRouter();
  const session = useUserContext();
  const query = useQueryContext();
  const searchParams = useSearchParams();

  const [gameName, setGameName] = useState<string>("New Game");
  const [deckName, setDeckName] = useState<string>("");
  const [selectedDeckId, setSelectedDeckId] = useState<string>("");
  const [isNewGame, setIsNewGame] = useState<boolean>(true);
  const [gameUuid, setGameUuid] = useState<string | null>(null);
  const [isPublicDeck, setIsPublicDeck] = useState<boolean>(false);
  const [publicDeckList, setPublicDeckList] = useState<Tables<"decks">[]>([]);
  const [privateDeckList, setPrivateDeckList] = useState<Tables<"decks">[]>([]);
  const [selectedDeck, setSelectedDeck] = useState<Tables<"decks"> | undefined>(undefined);
  const [userIsReady, setUserIsReady] = useState<boolean>(false);

  const handleGameNameChange = (e: any) => {
    setGameName(e);
  }

  const handleCreateGame = () => {
    if (!session?.user?.id) return;
    if (selectedDeckId === "") return;

    const upsertGameId = gameUuid ?? uuid();

    const newGame: Tables<"games"> = {
      id: upsertGameId,
      author: session?.user.id,
      deck: selectedDeckId,
      name: gameName
    }

    try {
      query?.upsertGame(newGame);
      setIsNewGame(false);
    } catch (e) {
      console.log("Error upserting deck");
    }

    setGameUuid(upsertGameId);
  }

  const loadGameFromUuid = async () => {
    if (!gameUuid) return;

    const res: any = await query?.getGameById(gameUuid);
    console.log("res", res);
    setGameName(res[0]["name"]);
    setIsNewGame(false);

    query?.getDeckById(res[0]["deck"]).then((deck: any) => {
      console.log("resseldeck", deck[0]);
      setSelectedDeck(deck[0]);
    })
  }

  const handleStartGame = () => {
    router.push(`/game?id=${gameUuid}`);
  }

  const handleSetDeckPublic = () => {
    setIsPublicDeck(!isPublicDeck);
  }

  const handleSelectDeck = (e) => {
    if (isPublicDeck) {
      setSelectedDeck(publicDeckList.find((deck) => deck.id === e.target.value))
    } else {
      setSelectedDeck(privateDeckList.find((deck) => deck.id === e.target.value))
    }
    setSelectedDeckId(e.target.value);
  }

  const handleDeleteGame = () => {
    if (!gameUuid) return;
    query?.deleteGameById(gameUuid);
    router.push("/");
  }

  useEffect(() => {
    session?.getSessionData();
  }, [])

  useEffect(() => {
    if (!gameUuid) return;
    query?.getGameById(gameUuid);
    loadGameFromUuid();

  }, [gameUuid])

  useEffect(() => {
    const fetchDecks = async () => {
      if (!session?.user?.id) return;

      const param = searchParams.get("id");
      setGameUuid(param);

      query?.getUserDecks(session.user.id).then((decks: any) => {
        setPrivateDeckList(decks);
        console.log("private list", privateDeckList, decks);
      });
      query?.getRecentPublicDecks().then((decks: any) => {
        setPublicDeckList(decks);
        console.log("public list", publicDeckList, decks);
      });
    };

    fetchDecks();
  }, [session?.user?.id, query]);

  return (
    <div className="min-h-sreen flex flex-col">
      <NavigationBar />

      <div className="container mx-auto gap-4">
        <Input
          className='max-w-sm mb-4'
          size='lg'
          variant='bordered'
          value={gameName}
          onValueChange={(e) => { handleGameNameChange(e) }}
          isClearable={isNewGame}
          isReadOnly={!isNewGame}
          isDisabled={!isNewGame}
        />
        <div className="flex flex-row gap-2 mb-2">
          {isNewGame ? (
            <Button
              variant="ghost"
              size="sm"
              onPress={() => handleCreateGame()}
            >Create Game</Button>
          ) : (
            <Button
              variant="ghost"
              size="sm"
              onPress={() => handleStartGame()}
            >Start</Button>
          )}
          {/*Ready*/}
          {/*<Button
            variant="ghost"
            size="sm"
          >Ready</Button>*/}
        </div>
        <div className="flex flex-row mx-auto gap-4">
          {/* -- Columns -- */}
          {/*Joined Players*/}
          <div className="flex-1 flex-col gap-4">
            <p className="text-lg font-bold mb-4">Joined Players</p>
          </div>
          {/*Cards from selected deck*/}
          <div className="flex-1 flex-col gap-4">
            {deckName.length ? (
              <p className="text-lg font-bold mb-4">{deckName}</p>
            ) : (
              <>
                <p className="text-md text-grey-500 font-bold mb-4">{selectedDeck?.name ?? `No deck selected`}</p>
                <div className="flex flex-col gap-2">
                  {selectedDeck?.cards && selectedDeck.cards.map((card: any, index) => (

                    <div className='container flex flex-row gap-6 h-20 items-center' key={index}>
                      <p className='text-sm text-center'>{index + 1}</p>
                      <Textarea
                        value={card.front}
                        className="w-full"
                        labelPlacement="outside"
                        variant='bordered'
                        isReadOnly
                      />
                      <Textarea
                        value={card.back}
                        className="w-full"
                        labelPlacement="outside"
                        variant='bordered'
                        isReadOnly
                      />
                    </div>
                  ))}
                </div>
              </>
            )}
          </div>
          {/*Settings*/}
          <div className="flex-1 flex-col">
            <div className="gap-4">
              <p className="text-lg font-bold mb-4">Game settings</p>
              <p className="mb-2">Deck type</p>
              <ButtonGroup className="mb-2">
                <Button
                  variant="ghost"
                  size="sm"
                  isDisabled={isPublicDeck || !isNewGame}
                  onClick={handleSetDeckPublic}
                >Public</Button>
                <Button
                  variant="ghost"
                  size="sm"
                  isDisabled={!isPublicDeck || !isNewGame}
                  onClick={handleSetDeckPublic}
                >Private</Button>
              </ButtonGroup>
              {isPublicDeck ? (
                <Select
                  className="max-w-sm mb-2"
                  size="sm"
                  placeholder="Deck name"
                  variant="bordered"
                  items={publicDeckList}
                  onChange={handleSelectDeck}
                  isDisabled={!isNewGame}
                >
                  {(deck) => <SelectItem>{deck.name}</SelectItem>}
                </Select>
              ) : (
                <Select
                  className="max-w-sm mb-2"
                  size="sm"
                  placeholder="Deck name"
                  variant="bordered"
                  items={privateDeckList}
                  onChange={handleSelectDeck}
                  isDisabled={!isNewGame}
                >
                  {(deck) => <SelectItem>{deck.name}</SelectItem>}
                </Select>
              )}
              <NumberInput className="max-w-sm mb-2" defaultValue={1} size="sm" label="Max players" minValue={1} maxValue={15} variant="bordered"
                isDisabled={!isNewGame}
              />
              <Button
                variant="ghost"
                size="sm"
                isDisabled={isNewGame}
                onPress={() => handleDeleteGame()}
              >Delete Game</Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
