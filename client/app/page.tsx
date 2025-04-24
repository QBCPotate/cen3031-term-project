"use client"
import { ButtonGroup, Button } from "@heroui/button"
import { AccountSection } from "@/components/Account";
import { NavigationBar } from "@/components/Navbar";
import { Card } from "@/components/Card";
import { useRouter } from "next/navigation";
import { useUserContext } from "@/contexts/UserProvider";
import { useEffect, useState } from "react";
import { DecksSection } from "@/components/DecksSection";
import { useQueryContext } from "@/contexts/QueryProvider";
import { Tables } from "@/types/database.types";
import { GamesSection } from "@/components/GamesSection";
import ToastCall from "@/components/Toast"


export default function Home() {

  const router = useRouter();
  const session = useUserContext();
  const query = useQueryContext();

  const [userDecks, setUserDecks] = useState<Tables<"decks">[] | undefined>(undefined);
  const [recentDecks, setRecentDecks] = useState<Tables<"decks">[] | undefined>(undefined);
  const [currentGames, setCurrentGames] = useState<Tables<"games">[] | undefined>(undefined);

  useEffect(() => {
    session?.getSessionData();
  }, [])

  useEffect(() => {
    const fetchUserDecks = async () => {
      if (!session?.user?.id) return;

      query?.getUserDecks(session.user.id).then((decks: any) => {
        setUserDecks(decks);
      });
      query?.getRecentPublicDecks().then((decks: any) => {
        setRecentDecks(decks);
      });
      query?.getCurrentGames().then((games: any) => {
        setCurrentGames(games);
      });
    };

    fetchUserDecks();
  }, [session?.user?.id, query]);

  if (!session?.user) return (
    /*Logged out screen*/
    <div className="min-h-screen flex flex-col">
      <div className="flex flex-col items-center align-center my-auto">
        <p className="text-xl">Welcome to GitGud</p>
        <ButtonGroup className="mx- my-2">
          <Button
            variant="ghost"
            onClick={() => router.push('/login')}
          >Log In</Button>
          <Button
            variant="ghost"
            onClick={() => router.push('/signup')}
          >Sign Up</Button>
        </ButtonGroup>
      </div>
    </div>
  )

  return (
    <div className="min-h-screen flex flex-col">
      <NavigationBar />
      <div className="flex-1 container mx-auto p-4 flex gap-4">

        {/* Column 1 */}
        <div className="flex-1 bg-gray-100 p-4 rounded-lg">
          <h2 className="text-xl font-bold mb-4">Current Games</h2>
          <Card
            title="New Game"
            details=""
            onClick={() => router.push('/creategame')}
            isMenuOpt
          />
          <div className="my-1" />
          {/*<Card title="Math Basics" details="50 cards" />*/}
          <GamesSection games={currentGames} />
        </div>

        {/* Column 2 */}
        <div className="flex-1 bg-gray-100 p-4 rounded-lg">
          <h2 className="text-xl font-bold mb-4">Community Decks</h2>
          <DecksSection decks={recentDecks} />
          <div className="space-y-3">
          </div>
        </div>

        {/* Column 3 */}
        <div className="flex-1">
          <div className="grow bg-gray-100 p-4 rounded-lg">
            <h2 className="text-xl font-bold mb-4">Account</h2>
            <AccountSection />
          </div>
          <div className="grow bg-gray-100 p-4 mt-4 rounded-lg scroll-auto">
            <h2 className="text-xl font-bold mb-4">Your Decks</h2>
            <DecksSection decks={userDecks} />
            <div className="flex flex-col center-items">
              <Card title="Create deck" details="" onClick={() => { router.push("/editor") }} isDisabled={!userDecks} isMenuOpt />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
