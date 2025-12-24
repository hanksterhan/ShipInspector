import swaggerJsdoc from "swagger-jsdoc";

const options: swaggerJsdoc.Options = {
    definition: {
        openapi: "3.0.0",
        info: {
            title: "Poker Utilities API",
            version: "1.0.0",
            description:
                "API for poker hand evaluation and equity calculation utilities",
            contact: {
                name: "API Support",
            },
        },
        servers: [
            {
                url: "http://localhost:3000",
                description: "Development server",
            },
        ],
        security: [
            {
                bearerAuth: [],
            },
        ],
        components: {
            securitySchemes: {
                bearerAuth: {
                    type: "http",
                    scheme: "bearer",
                    bearerFormat: "JWT",
                    description: "Enter JWT token obtained from /auth/login",
                },
            },
            schemas: {
                Card: {
                    type: "object",
                    properties: {
                        rank: {
                            type: "integer",
                            description:
                                "Card rank (2-14, where 11=Jack, 12=Queen, 13=King, 14=Ace)",
                            minimum: 2,
                            maximum: 14,
                            example: 14,
                        },
                        suit: {
                            type: "string",
                            enum: ["c", "d", "h", "s"],
                            description:
                                "Card suit (c=clubs, d=diamonds, h=hearts, s=spades)",
                            example: "h",
                        },
                    },
                    required: ["rank", "suit"],
                },
                HandRank: {
                    type: "object",
                    properties: {
                        category: {
                            type: "integer",
                            description:
                                "Hand category: 0=High Card, 1=Pair, 2=Two Pair, 3=Three of a Kind, 4=Straight, 5=Flush, 6=Full House, 7=Four of a Kind, 8=Straight Flush, 9=Royal Flush",
                            minimum: 0,
                            maximum: 9,
                            example: 6,
                        },
                        tiebreak: {
                            type: "array",
                            items: {
                                type: "integer",
                                minimum: 2,
                                maximum: 14,
                            },
                            description:
                                "Tiebreaker cards for comparing hands of the same category",
                            example: [14, 13],
                        },
                    },
                    required: ["category", "tiebreak"],
                },
                EquityOptions: {
                    type: "object",
                    properties: {
                        mode: {
                            type: "string",
                            enum: ["auto", "exact", "mc", "rust"],
                            description:
                                "Calculation mode: 'auto' chooses based on combo count, 'exact' enumerates all possibilities, 'mc' uses Monte Carlo simulation, 'rust' uses Rust WASM (preflop only)",
                            default: "auto",
                            example: "auto",
                        },
                        iterations: {
                            type: "integer",
                            description:
                                "Number of iterations for Monte Carlo simulation",
                            default: 10000,
                            minimum: 1,
                            example: 10000,
                        },
                        seed: {
                            type: "integer",
                            description:
                                "Seed for random number generator (for reproducible results)",
                            example: 12345,
                        },
                        exactMaxCombos: {
                            type: "integer",
                            description:
                                "Maximum combinations before falling back to Monte Carlo in auto mode",
                            default: 200000,
                            example: 200000,
                        },
                    },
                },
                EquityResult: {
                    type: "object",
                    properties: {
                        win: {
                            type: "array",
                            items: {
                                type: "number",
                                minimum: 0,
                                maximum: 1,
                            },
                            description:
                                "Win percentage per player (fraction 0-1)",
                            example: [0.85, 0.15],
                        },
                        tie: {
                            type: "array",
                            items: {
                                type: "number",
                                minimum: 0,
                                maximum: 1,
                            },
                            description:
                                "Tie percentage per player (fraction 0-1)",
                            example: [0.0, 0.0],
                        },
                        lose: {
                            type: "array",
                            items: {
                                type: "number",
                                minimum: 0,
                                maximum: 1,
                            },
                            description:
                                "Lose percentage per player (fraction 0-1)",
                            example: [0.15, 0.85],
                        },
                        samples: {
                            type: "integer",
                            description:
                                "Number of board completions evaluated",
                            example: 990,
                        },
                    },
                    required: ["win", "tie", "lose", "samples"],
                },
                EvaluateHandRequest: {
                    type: "object",
                    required: ["hole"],
                    properties: {
                        hole: {
                            type: "string",
                            description:
                                "Hole cards as space-separated string (e.g., '14h 14d' for pocket aces)",
                            example: "14h 14d",
                        },
                        board: {
                            type: "string",
                            description:
                                "Board cards as space-separated string (optional, e.g., '12h 11h 10h 9h 8h')",
                            example: "12h 11h 10h 9h 8h",
                            default: "",
                        },
                    },
                },
                EvaluateHandResponse: {
                    type: "object",
                    properties: {
                        handRank: {
                            $ref: "#/components/schemas/HandRank",
                        },
                        hole: {
                            type: "array",
                            items: {
                                $ref: "#/components/schemas/Card",
                            },
                        },
                        board: {
                            type: "array",
                            items: {
                                $ref: "#/components/schemas/Card",
                            },
                        },
                    },
                    required: ["handRank", "hole", "board"],
                },
                CompareHandsRequest: {
                    type: "object",
                    required: ["hole1", "hole2"],
                    properties: {
                        hole1: {
                            type: "string",
                            description: "First player's hole cards",
                            example: "14h 14d",
                        },
                        hole2: {
                            type: "string",
                            description: "Second player's hole cards",
                            example: "13h 13d",
                        },
                        board: {
                            type: "string",
                            description:
                                "Board cards as space-separated string",
                            example: "12h 11h 10h 9h 8h",
                            default: "",
                        },
                    },
                },
                CompareHandsResponse: {
                    type: "object",
                    properties: {
                        hand1: {
                            type: "object",
                            properties: {
                                hole: {
                                    type: "array",
                                    items: {
                                        $ref: "#/components/schemas/Card",
                                    },
                                },
                                rank: {
                                    $ref: "#/components/schemas/HandRank",
                                },
                            },
                        },
                        hand2: {
                            type: "object",
                            properties: {
                                hole: {
                                    type: "array",
                                    items: {
                                        $ref: "#/components/schemas/Card",
                                    },
                                },
                                rank: {
                                    $ref: "#/components/schemas/HandRank",
                                },
                            },
                        },
                        comparison: {
                            type: "object",
                            properties: {
                                result: {
                                    type: "string",
                                    enum: ["hand1_wins", "hand2_wins", "tie"],
                                    example: "hand1_wins",
                                },
                                value: {
                                    type: "integer",
                                    description:
                                        "1 if hand1 wins, -1 if hand2 wins, 0 if tie",
                                    example: 1,
                                },
                            },
                        },
                    },
                    required: ["hand1", "hand2", "comparison"],
                },
                CalculateEquityRequest: {
                    type: "object",
                    required: ["players"],
                    properties: {
                        players: {
                            type: "array",
                            items: {
                                type: "string",
                            },
                            description:
                                "Array of hole card strings (one per player)",
                            minItems: 2,
                            example: ["14h 14d", "13h 13d"],
                        },
                        board: {
                            type: "string",
                            description:
                                "Board cards as space-separated string (optional)",
                            example: "12h 11h 10h",
                            default: "",
                        },
                        options: {
                            $ref: "#/components/schemas/EquityOptions",
                        },
                        dead: {
                            type: "array",
                            items: {
                                type: "string",
                            },
                            description:
                                "Array of dead card strings (known excluded cards)",
                            example: ["9h", "8h"],
                        },
                    },
                },
                CalculateEquityResponse: {
                    type: "object",
                    properties: {
                        equity: {
                            $ref: "#/components/schemas/EquityResult",
                        },
                        players: {
                            type: "array",
                            items: {
                                type: "array",
                                items: {
                                    $ref: "#/components/schemas/Card",
                                },
                            },
                            description: "Parsed player cards",
                        },
                        board: {
                            type: "array",
                            items: {
                                $ref: "#/components/schemas/Card",
                            },
                        },
                        dead: {
                            type: "array",
                            items: {
                                $ref: "#/components/schemas/Card",
                            },
                        },
                    },
                    required: ["equity", "players", "board", "dead"],
                },
                ApiErrorResponse: {
                    type: "object",
                    properties: {
                        error: {
                            type: "string",
                            description: "Error message",
                            example: "Hole cards are required",
                        },
                    },
                    required: ["error"],
                },
            },
        },
    },
    apis: ["./src/routes/*.ts", "./src/handlers/*.ts"], // Path to the API files
};

export const swaggerSpec = swaggerJsdoc(options);
