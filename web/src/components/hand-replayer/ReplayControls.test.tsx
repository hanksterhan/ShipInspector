import { describe, it, expect, beforeEach, vi, afterEach } from "vitest";
import { render, screen, fireEvent, act } from "@testing-library/react";
import { ReplayControls } from "./ReplayControls";
import { useHandReplayStore } from "@/stores/useHandReplayStore";
import type { HandForPlayback, Street } from "@common/interfaces";

function createMockHand(): HandForPlayback {
  return {
    hand: {
      id: "hand-1",
      table_size: 6,
      button_seat: 0,
      small_blind: 50,
      big_blind: 100,
      ante: 0,
      board_flop_1: "14h",
      board_flop_2: "13h",
      board_flop_3: "12h",
      board_turn: "11h",
      board_river: "10h",
      created_at: Date.now(),
    },
    players: [
      {
        seat_index: 0,
        display_name: "Alice",
        stack_at_start: 10000,
        is_hero: true,
        showdown_card_1: "14s",
        showdown_card_2: "14d",
      },
      {
        seat_index: 1,
        display_name: "Bob",
        stack_at_start: 10000,
        is_hero: false,
        showdown_card_1: "13s",
        showdown_card_2: "13d",
      },
    ],
    actions: [
      {
        sequence_index: 0,
        street: "preflop" as Street,
        actor_seat: 0,
        action_type: "POST_SB",
        amount: 50,
        raise_to: null,
        tags: [],
      },
      {
        sequence_index: 1,
        street: "preflop" as Street,
        actor_seat: 1,
        action_type: "POST_BB",
        amount: 100,
        raise_to: null,
        tags: [],
      },
      {
        sequence_index: 2,
        street: "preflop" as Street,
        actor_seat: 0,
        action_type: "RAISE",
        amount: null,
        raise_to: 300,
        tags: [],
      },
      {
        sequence_index: 3,
        street: "preflop" as Street,
        actor_seat: 1,
        action_type: "CALL",
        amount: 200,
        raise_to: null,
        tags: [],
      },
      {
        sequence_index: 4,
        street: "flop" as Street,
        actor_seat: null,
        action_type: "DEAL_FLOP",
        amount: null,
        raise_to: null,
        tags: [],
      },
    ],
  };
}

describe("ReplayControls", () => {
  beforeEach(() => {
    act(() => {
      useHandReplayStore.setState({
        hand: null,
        currentActionIndex: -1,
        isPlaying: false,
        playbackSpeed: 800,
        loadStatus: "idle",
        loadError: null,
      });
    });
  });

  afterEach(() => {
    act(() => {
      useHandReplayStore.getState().dispose();
    });
  });

  it("renders nothing when hand is null", () => {
    const { container } = render(<ReplayControls />);
    expect(container.firstChild).toBeNull();
  });

  it("renders playback controls when hand is loaded", () => {
    const mockHand = createMockHand();
    act(() => {
      useHandReplayStore.setState({
        hand: mockHand,
        currentActionIndex: 0,
        isPlaying: false,
      });
    });

    render(<ReplayControls />);

    expect(screen.getByLabelText("Step back")).toBeInTheDocument();
    expect(screen.getByLabelText("Play")).toBeInTheDocument();
    expect(screen.getByLabelText("Step forward")).toBeInTheDocument();
    expect(screen.getByLabelText("Reset to start")).toBeInTheDocument();
  });

  it("shows play button when not playing", () => {
    const mockHand = createMockHand();
    useHandReplayStore.setState({
      hand: mockHand,
      currentActionIndex: 0,
      isPlaying: false,
    });

    render(<ReplayControls />);
    expect(screen.getByLabelText("Play")).toBeInTheDocument();
  });

  it("shows pause button when playing", () => {
    const mockHand = createMockHand();
    useHandReplayStore.setState({
      hand: mockHand,
      currentActionIndex: 0,
      isPlaying: true,
    });

    render(<ReplayControls />);
    expect(screen.getByLabelText("Pause")).toBeInTheDocument();
  });

  it("step forward button calls stepForward", () => {
    const mockHand = createMockHand();
    const stepForward = vi.fn();

    useHandReplayStore.setState({
      hand: mockHand,
      currentActionIndex: 0,
      isPlaying: false,
    });

    const originalStepForward = useHandReplayStore.getState().stepForward;
    useHandReplayStore.setState({ stepForward });

    render(<ReplayControls />);
    fireEvent.click(screen.getByLabelText("Step forward"));

    expect(stepForward).toHaveBeenCalled();

    useHandReplayStore.setState({ stepForward: originalStepForward });
  });

  it("step back button calls stepBack", () => {
    const mockHand = createMockHand();
    const stepBack = vi.fn();

    useHandReplayStore.setState({
      hand: mockHand,
      currentActionIndex: 1,
      isPlaying: false,
    });

    const originalStepBack = useHandReplayStore.getState().stepBack;
    useHandReplayStore.setState({ stepBack });

    render(<ReplayControls />);
    fireEvent.click(screen.getByLabelText("Step back"));

    expect(stepBack).toHaveBeenCalled();

    useHandReplayStore.setState({ stepBack: originalStepBack });
  });

  it("reset button calls reset", () => {
    const mockHand = createMockHand();
    const reset = vi.fn();

    useHandReplayStore.setState({
      hand: mockHand,
      currentActionIndex: 2,
      isPlaying: false,
    });

    const originalReset = useHandReplayStore.getState().reset;
    useHandReplayStore.setState({ reset });

    render(<ReplayControls />);
    fireEvent.click(screen.getByLabelText("Reset to start"));

    expect(reset).toHaveBeenCalled();

    useHandReplayStore.setState({ reset: originalReset });
  });

  it("keyboard space key toggles play/pause", async () => {
    const mockHand = createMockHand();
    const play = vi.fn();
    const pause = vi.fn();

    useHandReplayStore.setState({
      hand: mockHand,
      currentActionIndex: 0,
      isPlaying: false,
    });

    const originalPlay = useHandReplayStore.getState().play;
    const originalPause = useHandReplayStore.getState().pause;
    useHandReplayStore.setState({ play, pause });

    render(<ReplayControls />);

    fireEvent.keyDown(window, { key: " " });

    expect(play).toHaveBeenCalled();

    useHandReplayStore.setState({ play: originalPlay, pause: originalPause });
  });

  it("keyboard arrow left calls stepBack", () => {
    const mockHand = createMockHand();
    const stepBack = vi.fn();

    useHandReplayStore.setState({
      hand: mockHand,
      currentActionIndex: 1,
      isPlaying: false,
    });

    const originalStepBack = useHandReplayStore.getState().stepBack;
    useHandReplayStore.setState({ stepBack });

    render(<ReplayControls />);
    fireEvent.keyDown(window, { key: "ArrowLeft" });

    expect(stepBack).toHaveBeenCalled();

    useHandReplayStore.setState({ stepBack: originalStepBack });
  });

  it("keyboard arrow right calls stepForward", () => {
    const mockHand = createMockHand();
    const stepForward = vi.fn();

    useHandReplayStore.setState({
      hand: mockHand,
      currentActionIndex: 0,
      isPlaying: false,
    });

    const originalStepForward = useHandReplayStore.getState().stepForward;
    useHandReplayStore.setState({ stepForward });

    render(<ReplayControls />);
    fireEvent.keyDown(window, { key: "ArrowRight" });

    expect(stepForward).toHaveBeenCalled();

    useHandReplayStore.setState({ stepForward: originalStepForward });
  });

  it("displays current action description", () => {
    const mockHand = createMockHand();
    useHandReplayStore.setState({
      hand: mockHand,
      currentActionIndex: 0,
      isPlaying: false,
    });

    render(<ReplayControls />);
    expect(screen.getByText(/Current:/)).toBeInTheDocument();
  });

  it("renders street jump buttons", () => {
    const mockHand = createMockHand();
    useHandReplayStore.setState({
      hand: mockHand,
      currentActionIndex: 0,
      isPlaying: false,
    });

    render(<ReplayControls />);

    expect(screen.getByRole("button", { name: "preflop" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "flop" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "turn" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "river" })).toBeInTheDocument();
  });

  it("street jump button calls jumpToStreet", () => {
    const mockHand = createMockHand();
    const jumpToStreet = vi.fn();

    useHandReplayStore.setState({
      hand: mockHand,
      currentActionIndex: 0,
      isPlaying: false,
    });

    const originalJumpToStreet = useHandReplayStore.getState().jumpToStreet;
    useHandReplayStore.setState({ jumpToStreet });

    render(<ReplayControls />);
    fireEvent.click(screen.getByRole("button", { name: "flop" }));

    expect(jumpToStreet).toHaveBeenCalledWith("flop");

    useHandReplayStore.setState({ jumpToStreet: originalJumpToStreet });
  });
});
