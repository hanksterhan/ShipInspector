import { describe, it, expect, beforeEach } from "vitest";
import { render, screen } from "@testing-library/react";
import { EquityDisplay } from "./EquityDisplay";
import { useEquityCalculatorStore } from "@/stores";

describe("EquityDisplay", () => {
  beforeEach(() => {
    useEquityCalculatorStore.setState({
      equity: {
        status: "idle",
        data: null,
        error: null,
        playerEquity: new Map(),
        playerTieEquity: new Map(),
      },
    });
  });

  it("renders nothing when equity status is idle", () => {
    const { container } = render(<EquityDisplay />);
    expect(container.firstChild).toBeNull();
  });

  it("shows loading spinner when status is loading", () => {
    useEquityCalculatorStore.setState({
      equity: {
        status: "loading",
        data: null,
        error: null,
        playerEquity: new Map(),
        playerTieEquity: new Map(),
      },
    });

    render(<EquityDisplay />);
    expect(screen.getByText("Calculating equity...")).toBeInTheDocument();
  });

  it("shows error message when status is error", () => {
    useEquityCalculatorStore.setState({
      equity: {
        status: "error",
        data: null,
        error: "Network error occurred",
        playerEquity: new Map(),
        playerTieEquity: new Map(),
      },
    });

    render(<EquityDisplay />);
    expect(screen.getByText("Network error occurred")).toBeInTheDocument();
  });

  it("shows default error message when error is null", () => {
    useEquityCalculatorStore.setState({
      equity: {
        status: "error",
        data: null,
        error: null,
        playerEquity: new Map(),
        playerTieEquity: new Map(),
      },
    });

    render(<EquityDisplay />);
    expect(screen.getByText("Equity calculation failed")).toBeInTheDocument();
  });

  it("shows sample count when status is success", () => {
    useEquityCalculatorStore.setState({
      equity: {
        status: "success",
        data: {
          win: [0.5, 0.5],
          tie: [0.0, 0.0],
          samples: 100000,
        },
        error: null,
        playerEquity: new Map(),
        playerTieEquity: new Map(),
      },
    });

    render(<EquityDisplay />);
    expect(screen.getByText("100,000 samples")).toBeInTheDocument();
  });

  it("renders nothing when status is success but data is null", () => {
    useEquityCalculatorStore.setState({
      equity: {
        status: "success",
        data: null,
        error: null,
        playerEquity: new Map(),
        playerTieEquity: new Map(),
      },
    });

    const { container } = render(<EquityDisplay />);
    expect(container.firstChild).toBeNull();
  });
});
