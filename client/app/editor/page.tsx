"use client"
import React, { useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Button } from "@heroui/button";
import { NavigationBar } from '@/components/Navbar';
import { Input, Textarea } from '@heroui/input';
import { groupDataFocusVisibleClasses } from '@heroui/theme';
import { Database, Tables } from '@/types/database.types';
import { useUserContext } from '@/contexts/UserProvider';
import { useQueryContext } from '@/contexts/QueryProvider';
import { v4 as uuid } from 'uuid';
import { UUID } from 'crypto';
import { addToast } from "@heroui/toast";

const Editor: React.FC = () => {
  const router = useRouter();
  const session = useUserContext();
  const query = useQueryContext();
  const searchParams = useSearchParams();

  type Card = { front: string, back: string }

  const [deck, setDeck] = useState<Card[]>([]);
  const [deckUuid, setDeckUuid] = useState<string | null>(null);
  const [currentCard, setCurrentCard] = useState<Card>({ front: "", back: "" });
  const [isEditing, setIsEditing] = useState<boolean>(false);
  const [isNewDeck, setIsNewDeck] = useState<boolean>(true);
  const [isOwner, setIsOwner] = useState<boolean>(false);
  const [deckHasChanged, setDeckHasChanged] = useState<boolean>(false);
  const [deckName, setDeckName] = useState<string>("New Deck");
  const [isPublicDeck, setIsPublicDeck] = useState<boolean>(false);
  const [deckAuthorId, setDeckAuthorId] = useState<Tables<"decks">["author"]>("");

  // TODO UI:
  // create a way to show error messages on screen

  const isCardEmpty = (): boolean => {
    return currentCard.front.trim() === "" || currentCard.back.trim() === "";
  }

  const cardHasText = (): boolean => {
    return currentCard.front.trim() !== "" || currentCard?.back.trim() !== ""
  }

  const handleAddCard = () => {
    setDeck([...deck, currentCard]);
    setCurrentCard({ front: "", back: "" })
    setDeckHasChanged(true);
    console.log("change");
    addToast({ title: "Card changed!" })
  }

  const handleEditCardFront = (index: number, e: any) => {
    setDeck(deck.map(card => {
      if (card === deck.at(index)) {
        return { ...card, front: e.target.value }
      } else {
        return card;
      }
    }))
    setDeckHasChanged(true);
  }

  const handleEditCardBack = (index: number, e: any) => {
    setDeck(deck.map(card => {
      if (card === deck.at(index)) {
        return { ...card, back: e.target.value }
      } else {
        return card;
      }
    }))
    setDeckHasChanged(true);
  }

  const handleDeleteCard = (index: number) => {
    if (index < 0 || index >= deck.length) return;
    deck.splice(index, 1);
    setDeck([...deck])
    setDeckHasChanged(true);
    console.log("change");
    addToast({ title: "Card deleted!" })
  }

  const handleClearNewCard = () => {
    setCurrentCard({ front: "", back: "" })
  }

  const handleUpsertDeck = () => {
    if (!session?.user) return;

    setIsEditing(!isEditing);

    const upsertDeckUuid = deckUuid ?? uuid();
    // Because a deck query will throw once the deckUuid changes because of a [deckUuid] useEffect, we have to set it at the end in case if its a new deck. This const is either set to the existing deckUuid if it has already been passed to the page through a search parameter, or generates a new one if it is undefined. The operator used is called a Nullish Coalescing operator.

    const newDeck: Tables<"decks"> = {
      id: upsertDeckUuid,
      author: session?.user.id,
      name: deckName,
      cards: [...deck],
      total_cards: deck.length,
      isPublic: isPublicDeck
    }

    try {
      query?.upsertDeck(newDeck);
      setDeckHasChanged(false);
    } catch (e) {
      setDeckHasChanged(true);
      console.log("Error upserting deck");
      addToast({ title: "Error upserting deck" })
    }

    if (isNewDeck) {
      setIsNewDeck(false);
      setIsEditing(false);
      setDeckUuid(upsertDeckUuid);
      addToast({ title: "Created new Deck!" })
    } else {
      addToast({ title: "Deck changes saved" })
    }
  }

  const handleEditDeck = () => {
    setIsEditing(!isEditing);
  }

  const handleDeckNameChange = (e: any) => {
    setDeckName(e);
    setDeckHasChanged(true);
  }

  const handleChangeDeckPublic = () => {
    setDeckHasChanged(true);
    setIsPublicDeck(!isPublicDeck);
  }

  const handleCancelEdits = () => {
    setIsEditing(false);
    loadDeckFromUuid();
  }

  const loadDeckFromUuid = async () => {
    if (!deckUuid) return;
    // if (isNewDeck) return;
    // query?.getDeckById(deckUuid).then(res => {
    // TODO: validate json
    const res: any = await query?.getDeckById(deckUuid);
    console.log(res);
    setDeck(res[0]["cards"]);
    setDeckName(res[0]["name"]);
    setIsNewDeck(false);
    setIsPublicDeck(res[0]["isPublic"]);
    setDeckAuthorId(res[0]["author"]);
  }

  const handleDeleteDeck = () => {
    if (!deckUuid) return;
    setDeck([]);
    setDeckName("New Deck");
    setIsEditing(false);
    setIsNewDeck(true);
    query?.deleteDeckById(deckUuid);
    router.push("/");
    addToast({ title: "Deck deleted!" })
  }

  const checkIfUserIsOwner = () => {
    console.log("FLAG 2")
    // if (isNewDeck) {
    //   setIsOwner(true);
    //   return;
    // }
    setIsOwner(session?.user?.id === deckAuthorId);
    console.log(isOwner, session?.user?.id, deckAuthorId);
    return;
  }

  useEffect(() => {
    // If a deck is passed as a search parameter in url, fetch the deck.
    if (!session?.user) return;
    const param = searchParams.get("deck");
    setDeckUuid(param); // will stay as null if it doesn't exist. Useful for later checks.
  }, [session])

  useEffect(() => {
    if (!deckUuid) return;
    query?.getDeckById(deckUuid);
    loadDeckFromUuid();
  }, [deckUuid])

  useEffect(() => {
    checkIfUserIsOwner();
  }, [deckAuthorId]);

  return (
    <div className="min-h-screen flex flex-col">
      <NavigationBar />

      <div className="container mx-auto flex-1">
        <h1 className="text-2xl font-bold mb-4">{deckUuid ? ("Edit Deck") : ("Create Deck")}</h1>

        <div className="grid grid-cols-2 gap-6">
          <Textarea
            label="New card front"
            value={currentCard.front}
            onChange={(e) => setCurrentCard({ ...currentCard, front: e.target.value })}
            className="w-full"
            labelPlacement="outside"
            variant='bordered'
          />
          <Textarea
            label="New card back"
            value={currentCard.back}
            onChange={(e) => setCurrentCard({ ...currentCard, back: e.target.value })}
            className="w-full"
            labelPlacement="outside"
            variant='bordered'
          />
        </div>
        <div className='flex flex-row mt-2 gap-2'>
          <Button
            variant='ghost'
            size='sm'
            onPress={() => handleAddCard()}
            isDisabled={!isEditing && !isNewDeck || isCardEmpty()}
          >Add Card</Button>
          <Button variant='ghost' size='sm' onPress={() => handleClearNewCard()} isDisabled={!cardHasText()}>Clear</Button>
        </div>

        {/* Deck Preview */}
        {deck.length == 0 ? (
          <></>
        ) : (
          <>
            <hr className='my-6' />
            <div className='flex flex-row gap-2 mb-6 items-center'>
              <Input
                className='w-auto'
                size='sm'
                variant='bordered'
                value={deckName}
                onValueChange={(e) => { handleDeckNameChange(e) }}
                isClearable={isEditing || isNewDeck}
                isReadOnly={!isEditing && !isNewDeck}
                isDisabled={!isEditing && !isNewDeck}
              />
              <>
                {isNewDeck ? (
                  <Button variant='ghost' size='sm' onPress={() => handleUpsertDeck()}>Create Deck</Button>
                ) : (
                  <>
                    {!isEditing ? (
                      <Button variant='ghost' size='sm' onPress={() => handleEditDeck()} isDisabled={!isOwner}>Edit Deck</Button>
                    ) : (
                      <>
                        <Button variant='ghost' size='sm' onPress={() => handleUpsertDeck()} isDisabled={!deckHasChanged}>Save Deck</Button>
                        <Button variant='ghost' size='sm' onPress={() => handleDeleteDeck()}>Delete Deck</Button>
                        <Button variant='ghost' size='sm' onPress={() => handleChangeDeckPublic()}>{isPublicDeck ? ("Make private") : ("Make public")}</Button>
                        <Button variant='ghost' size='sm' onPress={() => handleCancelEdits()}>Cancel</Button>
                      </>
                    )}
                  </>
                )}
              </>
              {!isOwner && !isNewDeck && (
                <p className="text-gray-500 text-sm">You do not own this deck</p>
              )}
            </div>
            <div className='flex flex-col gap-2'>
              {deck.map((card, index) => (
                <div className="container mx-auto" key={index}>
                  <div className='container flex flex-row gap-6 h-20'>
                    <div className='flex flex-col justify-center gap-1'>
                      <p className='text-sm text-center'>{index + 1}</p>
                      <Button variant='ghost' size='sm' onPress={() => handleDeleteCard(index)}
                        isDisabled={!isEditing}
                      >Delete</Button>
                    </div>
                    <Textarea
                      value={card.front}
                      className="w-full"
                      labelPlacement="outside"
                      variant='bordered'
                      onChange={(e) => handleEditCardFront(index, e)}
                      isReadOnly={!isEditing && !isNewDeck}
                      isDisabled={!isEditing && !isNewDeck}
                    />
                    <Textarea
                      value={card.back}
                      className="w-full"
                      labelPlacement="outside"
                      variant='bordered'
                      onChange={(e) => handleEditCardBack(index, e)}
                      isReadOnly={!isEditing && !isNewDeck}
                      isDisabled={!isEditing && !isNewDeck}
                    />
                  </div>
                </div>
              ))}
            </div>
            <div className='mb-6' />
          </>
        )}
      </div>
    </div>
  );
};

export default Editor;
