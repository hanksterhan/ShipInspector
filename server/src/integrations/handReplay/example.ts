/**
 * Usage example for hand replayer database functions
 *
 * This demonstrates how to:
 * 1. Create a hand
 * 2. Add players
 * 3. Append actions
 * 4. Tag actions
 * 5. Fetch a hand for playback
 */

import {
    createHand,
    addHandPlayer,
    appendAction,
    setActionTags,
    getHandForPlayback,
    getActionTags,
} from "./handReplayDb";

async function example() {
    const userId = "123e4567-e89b-12d3-a456-426614174000"; // Example UUID

    try {
        // 1. Create a hand
        const handId = await createHand({
            userId,
            tableSize: 6,
            maxPlayers: 6,
            smallBlind: 25,
            bigBlind: 50,
            ante: 0,
            currency: "chips",
            buttonSeat: 1,
            boardCards: [],
            meta: {
                tournament: false,
                cashGame: true,
            },
        });

        console.log(`Created hand: ${handId}`);

        // 2. Add players
        const heroId = await addHandPlayer({
            handId,
            seat: 1,
            playerLabel: "Hero",
            startingStack: 10000,
            holeCards: ["As", "Kh"],
            isHero: true,
        });

        const villainId = await addHandPlayer({
            handId,
            seat: 2,
            playerLabel: "Villain",
            startingStack: 9500,
            holeCards: [], // Unknown cards
            isHero: false,
        });

        console.log(`Added players: Hero=${heroId}, Villain=${villainId}`);

        // 3. Append actions
        // Preflop actions
        await appendAction({
            handId,
            street: "PREFLOP",
            type: "POST_SB",
            actorPlayerId: heroId,
            amount: 25,
        });

        await appendAction({
            handId,
            street: "PREFLOP",
            type: "POST_BB",
            actorPlayerId: villainId,
            amount: 50,
        });

        await appendAction({
            handId,
            street: "PREFLOP",
            type: "RAISE",
            actorPlayerId: heroId,
            amount: 150,
            raiseTo: 200,
            decisionMs: 2500, // Tanked for 2.5 seconds
        });

        const callActionId = await appendAction({
            handId,
            street: "PREFLOP",
            type: "CALL",
            actorPlayerId: villainId,
            amount: 150,
            decisionMs: 150, // Snap called
        });

        // Deal flop
        await appendAction({
            handId,
            street: "FLOP",
            type: "DEAL_FLOP",
            // No actor for dealer actions
        });

        // Flop actions
        await appendAction({
            handId,
            street: "FLOP",
            type: "CHECK",
            actorPlayerId: heroId,
            decisionMs: 800,
        });

        await appendAction({
            handId,
            street: "FLOP",
            type: "BET",
            actorPlayerId: villainId,
            amount: 300,
            decisionMs: 1200,
        });

        // 4. Tag an action (e.g., mark the call as "snap")
        await setActionTags(callActionId, ["snap"]);

        // Tag the raise as "tanked"
        const raiseActionId = await appendAction({
            handId,
            street: "FLOP",
            type: "FOLD",
            actorPlayerId: heroId,
            decisionMs: 3500,
        });
        await setActionTags(raiseActionId, ["tanked"]);

        console.log("Actions added and tagged");

        // 5. Fetch hand for playback
        const playbackData = await getHandForPlayback(handId);

        if (playbackData) {
            console.log("\n=== Hand Playback Data ===");
            console.log(`Hand ID: ${playbackData.hand.id}`);
            console.log(`Table: ${playbackData.hand.table_size}-max`);
            console.log(
                `Blinds: ${playbackData.hand.small_blind}/${playbackData.hand.big_blind}`
            );
            console.log(`\nPlayers (${playbackData.players.length}):`);
            playbackData.players.forEach((p) => {
                console.log(
                    `  Seat ${p.seat}: ${p.player_label}${p.is_hero ? " (Hero)" : ""} - Stack: ${p.starting_stack}, Cards: ${p.hole_cards.join(", ") || "Unknown"}`
                );
            });
            console.log(`\nActions (${playbackData.actions.length}):`);
            playbackData.actions.forEach((a) => {
                const actor = playbackData.players.find(
                    (p) => p.id === a.actor_player_id
                );
                const actorName = actor ? actor.player_label : "Dealer";
                const tags =
                    a.tags.length > 0
                        ? ` [${a.tags.map((t) => t.key).join(", ")}]`
                        : "";
                console.log(
                    `  ${a.action_index}. ${a.street}: ${actorName} ${a.type}${a.amount ? ` ${a.amount}` : ""}${a.raise_to ? ` (to ${a.raise_to})` : ""}${tags}`
                );
            });
        }

        // 6. Get available tags
        const tags = await getActionTags();
        console.log(`\nAvailable tags: ${tags.map((t) => t.key).join(", ")}`);
    } catch (error) {
        console.error("Error in example:", error);
        throw error;
    }
}

// Uncomment to run:
// example().catch(console.error);

export { example };
