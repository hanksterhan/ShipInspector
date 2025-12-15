import { Card } from "@common/interfaces";
import { action, makeObservable, observable } from "mobx";

export class DeckStore {
    constructor() {
        makeObservable(this);
    }

    @observable
    deckCards: Card[] = [];

    // Track cards that are currently selected/used
    @observable
    selectedCards: Card[] = [];

    @action
    setDeckCards(cards: Card[]) {
        this.deckCards = cards;
    }

    get getDeckCards() {
        return this.deckCards;
    }

    @action
    removeCardFromDeck(card: Card) {
        this.deckCards = this.deckCards.filter((c) => c !== card);
    }

    @action
    addCardToDeck(card: Card) {
        this.deckCards.push(card);
    }

    @action
    initializeDeck() {
        // Initialize with all 52 cards
        const suits: ("c" | "d" | "h" | "s")[] = ["c", "d", "h", "s"];
        const ranks: (2 | 3 | 4 | 5 | 6 | 7 | 8 | 9 | 10 | 11 | 12 | 13 | 14)[] = [
            2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14,
        ];
        const cards: Card[] = [];
        for (const suit of suits) {
            for (const rank of ranks) {
                cards.push({ rank, suit });
            }
        }
        this.deckCards = cards;
    }

    isCardInDeck(card: Card) {
        return this.deckCards.some(
            (c) => c.rank === card.rank && c.suit === card.suit
        );
    }

    @action
    markCardAsSelected(card: Card) {
        if (!this.isCardSelected(card)) {
            this.selectedCards.push(card);
        }
    }

    @action
    markCardAsUnselected(card: Card) {
        this.selectedCards = this.selectedCards.filter(
            (c) => !(c.rank === card.rank && c.suit === card.suit)
        );
    }

    isCardSelected(card: Card): boolean {
        return this.selectedCards.some(
            (c) => c.rank === card.rank && c.suit === card.suit
        );
    }

    @action
    clearSelectedCards() {
        this.selectedCards = [];
    }
}
