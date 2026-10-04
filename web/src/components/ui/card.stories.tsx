import type { Meta, StoryObj } from "@storybook/react-vite";
import { MoreHorizontal } from "lucide-react";
import { Card, CardHeader, CardTitle, CardDescription, CardAction, CardContent, CardFooter } from "./card";
import { Button } from "./button";

const meta = { title: "UI/Card", component: Card, tags: ["autodocs"] } satisfies Meta<typeof Card>;
export default meta;
type Story = StoryObj<typeof meta>;
export const Complete: Story = { render: () => <Card className="max-w-md"><CardHeader><CardTitle>Friday table</CardTitle><CardDescription>5 / 10 · Six players</CardDescription></CardHeader><CardContent>Pot: 60 chips</CardContent><CardFooter><Button>Open table</Button></CardFooter></Card> };
export const Minimal: Story = { render: () => <Card className="max-w-md"><CardContent>Pot: 60 chips</CardContent></Card> };
export const LongContent: Story = { render: () => <Card className="max-w-md"><CardHeader><CardTitle>Friday table with the full nine player group</CardTitle></CardHeader><CardContent>{Array.from({ length: 20 }, (_, i) => <p key={i}>Hand {i + 1}: Alex calls 10. Marina raises to 30.</p>)}</CardContent></Card> };
export const Action: Story = { render: () => <Card className="max-w-md"><CardHeader><CardTitle>Friday table</CardTitle><CardDescription>5 / 10</CardDescription><CardAction><Button size="icon" variant="ghost" aria-label="Table menu"><MoreHorizontal /></Button></CardAction></CardHeader><CardContent>Pot: 60 chips</CardContent><CardFooter><Button>Open table</Button></CardFooter></Card> };
