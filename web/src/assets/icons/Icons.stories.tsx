import type { Meta, StoryObj } from "@storybook/react-vite";
import { ArrowDown, ArrowLeft, ArrowRight, ArrowUp, ArrowUpDown, ArrowUpRight, Bot, BrainCircuit, Calculator, Calendar, Check, CheckIcon, ChevronDown, ChevronDownIcon, ChevronLeft, ChevronRight, ChevronUpIcon, CircleDot, CircleHelp, Copy, Crosshair, Crown, Dices, Download, Eye, EyeOff, Filter, Flame, FolderOpen, Gamepad2, Grid3X3, Layers, Layers3, List, Loader2, LoaderCircle, LogOut, Menu, PanelLeft, PanelLeftClose, Pause, Percent, Play, Plus, RotateCcw, Sailboat, Search, Settings, Ship, SkipBack, SkipForward, Table2, Timer, Trash2, Upload, UserPlus, UserRound, Users, Waves, WifiOff, X, XCircle, XIcon } from "lucide-react";
import { CardBackIcon, ClubsIcon, DiamondsIcon, HeartsIcon, SpadesIcon } from "./index";

const custom = { CardBackIcon, ClubsIcon, DiamondsIcon, HeartsIcon, SpadesIcon };
const app = { ArrowDown, ArrowLeft, ArrowRight, ArrowUp, ArrowUpDown, ArrowUpRight, Bot, BrainCircuit, Calculator, Calendar, Check, CheckIcon, ChevronDown, ChevronDownIcon, ChevronLeft, ChevronRight, ChevronUpIcon, CircleDot, CircleHelp, Copy, Crosshair, Crown, Dices, Download, Eye, EyeOff, Filter, Flame, FolderOpen, Gamepad2, Grid3X3, Layers, Layers3, List, Loader2, LoaderCircle, LogOut, Menu, PanelLeft, PanelLeftClose, Pause, Percent, Play, Plus, RotateCcw, Sailboat, Search, Settings, Ship, SkipBack, SkipForward, Table2, Timer, Trash2, Upload, UserPlus, UserRound, Users, Waves, WifiOff, X, XCircle, XIcon };
function Gallery({ icons }: { icons: typeof app | typeof custom }) {
  return <div className="grid grid-cols-3 gap-6 sm:grid-cols-6">{Object.entries(icons).map(([name, Icon]) => <figure key={name} data-case={name} className="flex flex-col items-center gap-2"><Icon className="size-8" /><figcaption className="text-xs">{name}</figcaption></figure>)}</div>;
}
const meta = { title: "Icons/Gallery", tags: ["autodocs"] } satisfies Meta;
export default meta;
type Story = StoryObj<typeof meta>;
export const CustomIcons: Story = { render: () => <Gallery icons={custom} /> };
export const AppIcons: Story = { render: () => <Gallery icons={app} /> };
