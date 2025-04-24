import { Database, Tables } from "@/types/database.types";
import { createClient } from "@/utils/supabase/client";
import { createContext, useContext, useEffect, useState } from "react"

type QueryContextType = {
  userData: Tables<"user_storage"> | undefined;
  getUserStorageRowFromId: (id: Tables<"user_storage">["id"]) => void;
  getUserDecks: (id: Tables<"user_storage">["id"]) => void;
  getRecentPublicDecks: () => void;
  getDeckById: (id: Tables<"decks">["id"]) => void;
  upsertDeck: (deck: Tables<"decks">) => void;
  deleteDeckById: (deckId: Tables<"decks">["id"]) => void;
  getCurrentGames: () => void;
  getGameById: (id: Tables<"games">["id"]) => void;
  upsertGame: (game: Tables<"games">) => void;
  deleteGameById: (gameId: Tables<"games">["id"]) => void;
}

const QueryContext = createContext<QueryContextType | undefined>(undefined);

// This allows the the context to be accessed via any component or page. Use something like "session = useUserContext()" and you can access state and functions via "session?.user?.id" "session?.signOut()" etc
export const useQueryContext = () => {
  return useContext(QueryContext);
}

// Please read to better understand:
// https://vercel.com/guides/react-context-state-management-nextjs
// https://react.dev/reference/react/useContext
//
// This function is used in app/providers.tsx in order to implement the context as a way for the user session to be accessed globally.
export const QueryProvider = ({ children }: { children: React.ReactNode }) => {

  const supabase = createClient();

  const [userData, setUserData] = useState<Database["public"]["Tables"]["user_storage"]["Row"] | undefined>(undefined);

  const getUserStorageRowFromId = async (id: Tables<"user_storage">["id"]) => {
    const { data, error } = await supabase.from("user_storage").select().eq("id", id);
    if (data) setUserData(data[0]);
    if (error) console.log(error);
  }

  const getUserDecks = async (userId: Tables<"user_storage">["id"]) => {
    const { data, error } = await supabase.from("decks").select().eq("author", userId).order("created_at", { ascending: false });
    if (error) console.log(error);
    return data;
  }

  const getRecentPublicDecks = async () => {
    const { data, error } = await supabase.from("decks").select().eq("isPublic", true).limit(20).order("created_at", { ascending: false });
    if (error) console.log(error);
    return data;
  }

  const getDeckById = async (deckId: Tables<"decks">["id"]) => {
    const { data, error } = await supabase.from("decks").select().eq("id", deckId);
    if (error) console.log(error);
    return data;
  }

  const upsertDeck = async (deck: Tables<"decks">) => {
    const { error } = await supabase.from("decks").upsert(deck);
    if (error) console.log(error);
    console.log("Query Context: deck upsertion handled");
  }

  const deleteDeckById = async (deckId: Tables<"decks">["id"]) => {
    const { error } = await supabase.from("decks").delete().eq("id", deckId);
    if (error) console.log(error);
    console.log("Query Context: deck deletion handled");
  }

  const getCurrentGames = async () => {
    const { data, error } = await supabase.from("games").select().limit(20).order("created_at", { ascending: false });
    if (error) console.log(error);
    return data;
  }

  const getGameById = async (deckId: Tables<"games">["id"]) => {
    const { data, error } = await supabase.from("games").select().eq("id", deckId);
    if (error) console.log(error);
    return data;
  }

  const upsertGame = async (game: Tables<"games">) => {
    const { error } = await supabase.from("games").upsert(game);
    if (error) console.log(error);
    console.log("Query Context: game upsertion handled");
  }

  const deleteGameById = async (gameId: Tables<"games">["id"]) => {
    const { error } = await supabase.from("games").delete().eq("id", gameId);
    if (error) console.log(error);
    console.log("Query Context: game deletion handled");
  }

  return (
    <QueryContext.Provider value={{ userData, getUserStorageRowFromId, getUserDecks, getRecentPublicDecks, getDeckById, upsertDeck, deleteDeckById, getCurrentGames, getGameById, upsertGame, deleteGameById }} >
      {children}
    </QueryContext.Provider>
  )
}
