import { useEffect, useState } from "react";
import { useQueryContext } from "@/contexts/QueryProvider";
import { useRouter } from "next/navigation";
import { useUserContext } from "@/contexts/UserProvider";
import { Card } from "@/components/Card";
import { Tables } from "@/types/database.types";

export const GamesSection = ({
  games
}: {
  games: Tables<"games">[] | undefined;
}) => {
  const router = useRouter();
  const queryContext = useQueryContext();
  const userContext = useUserContext();

  const [isLoading, setIsLoading] = useState(true);

  const handleGameClick = (gameId: string) => {
    router.push(`/creategame?id=${gameId}`);
  };

  useEffect(() => {
    if (games === undefined) {
      setIsLoading(true);
    } else {
      setIsLoading(false);
    }
  }, [games])

  if (isLoading) return (
    <p className="text-gray-500 mb-4">Loading games...</p>
  )

  if (games?.length === 0) return (
    <p className="mb-4">No games found.</p>
  )

  return (
    <div className="flex flex-col gap-2 mb-4">
      {games?.map((game) => (
        <Card
          key={game.id}
          title={game.name || "Untitled Game"}
          onClick={() => handleGameClick(game.id)}
          isMenuOpt={false}
        />
      ))}
    </div>
  );
}
