import { useParams } from "react-router-dom";

export default function HandReplayerPage() {
  const { handId } = useParams<{ handId: string }>();

  return (
    <div className="p-8">
      <h1 className="text-2xl font-bold">Hand Replayer</h1>
      <p className="mt-2 text-muted-foreground">
        {handId ? `Replaying hand: ${handId}` : "Select a hand to replay"}
      </p>
    </div>
  );
}
