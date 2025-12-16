import { action, makeObservable, observable } from "mobx";
import { Card, Hole, CardSuit, CardRank } from "@common/interfaces";

export type SelectionStage = "suit" | "rank" | "complete";

export class CardStore {
    constructor() {
        makeObservable(this);
    }

    @observable
    boardCards: Card[] = [];

    // index of Hole cards indicates the player's index
    @observable
    holeCards: Hole[] = [];

    //default number of players is 2 (heads up)
    @observable
    players: number = 2;

    // Card selection state for the card selector component
    @observable
    selectionStage: SelectionStage = "suit";

    @observable
    selectedSuit: CardSuit | null = null;

    @observable
    selectedRank: CardRank | null = null;

    @observable
    selectedCard: Card | null = null;

    @action
    setBoardCards(cards: Card[]) {
        this.boardCards = cards;
    }

    @action
    addBoardCard(card: Card) {
        this.boardCards.push(card);
    }

    @action
    removeBoardCard(card: Card) {
        this.boardCards = this.boardCards.filter((c) => c !== card);
    }

    get getBoardCards() {
        return this.boardCards;
    }

    @action
    setHoleCards(cards: Hole[]) {
        this.holeCards = cards;
    }

    @action
    addHoleCard(card: Hole) {
        this.holeCards.push(card);
    }

    @action
    removeHoleCard(card: Hole) {
        this.holeCards = this.holeCards.filter((c) => c !== card);
    }

    get getHoleCards() {
        return this.holeCards;
    }

    @action
    setPlayers(players: number) {
        this.players = players;
    }

    get getPlayers() {
        return this.players;
    }

    @action
    setSelectedSuit(suit: CardSuit) {
        this.selectedSuit = suit;
        this.selectionStage = "rank";
    }

    @action
    setSelectedRank(rank: CardRank) {
        this.selectedRank = rank;
        if (this.selectedSuit) {
            this.selectedCard = { rank, suit: this.selectedSuit };
            this.selectionStage = "complete";
        }
    }

    @action
    resetSelection() {
        this.selectedSuit = null;
        this.selectedRank = null;
        this.selectedCard = null;
        this.selectionStage = "suit";
    }

    @action
    clearSelectedCard() {
        this.selectedCard = null;
        this.selectionStage = "suit";
    }

    // Hole selection state
    @observable
    currentPlayer: number = 0;

    @observable
    holeCardIndex: number = 0; // 0 for first card, 1 for second card

    @observable
    selectedHoleCards: Card[] = [];

    @action
    setCurrentPlayer(player: number) {
        this.currentPlayer = player;
    }

    @action
    addHoleCardToSelection(card: Card) {
        if (this.holeCardIndex === 0) {
            this.selectedHoleCards = [card];
            this.holeCardIndex = 1;
            this.resetSelection();
        } else if (this.holeCardIndex === 1) {
            this.selectedHoleCards = [this.selectedHoleCards[0], card];
            // Create hole and add to store
            const hole: Hole = { cards: [this.selectedHoleCards[0], card] };
            // Set the hole for the current player (will create array entries if needed)
            this.holeCards[this.currentPlayer] = hole;
            // Reset for next selection
            this.selectedHoleCards = [];
            this.holeCardIndex = 0;
            this.currentPlayer += 1;
            this.resetSelection();
        }
    }

    @action
    resetHoleSelection() {
        this.selectedHoleCards = [];
        this.holeCardIndex = 0;
        this.currentPlayer = 0;
        this.holeCards = [];
        this.resetSelection();
    }

    @action
    startHoleSelectionForPlayer(player: number) {
        this.currentPlayer = player;
        this.selectedHoleCards = [];
        this.holeCardIndex = 0;
        this.resetSelection();
    }
}
