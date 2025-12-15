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
}
