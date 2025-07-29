import { BotMessageSquare } from "lucide-react";
import { BatteryCharging } from "lucide-react";
import { Fingerprint } from "lucide-react";
import { ShieldHalf } from "lucide-react";
import { PlugZap } from "lucide-react";
import { GlobeLock } from "lucide-react";

import user1 from "../assets/profile-pictures/user1.jpg";
import user2 from "../assets/profile-pictures/user2.jpg";
import user3 from "../assets/profile-pictures/user3.jpg";
import user4 from "../assets/profile-pictures/user4.jpg";
import user5 from "../assets/profile-pictures/user5.jpg";
import user6 from "../assets/profile-pictures/user6.jpg";

export const navItems = [
  { label: "Features", href: "#" },
  { label: "Workflow", href: "#" },
  { label: "Pricing", href: "#" },
  { label: "Testimonials", href: "#" },
];

export const testimonials = [
  {
    user: "John Doe",
    company: "Stellar Solutions",
    image: user1,
    text: "Octopus streamlined our entire AI task pipeline. The agent pods handled repetitive tasks with precision, freeing up our engineers to focus on core innovation.",
  },
  {
    user: "Jane Smith",
    company: "Blue Horizon Technologies",
    image: user2,
    text: "We were blown away by the multi-agent collaboration. Octopus helped us simulate strategies, validate ideas, and automate research—faster than ever before.",
  },
  {
    user: "David Johnson",
    company: "Quantum Innovations",
    image: user3,
    text: "The orchestration layer in Octopus is a masterpiece. It connects agents across pods and ensures every step is traceable with blockchain reasoning logs.",
  },
  {
    user: "Ronee Brown",
    company: "Fusion Dynamics",
    image: user4,
    text: "Before Octopus, we were stuck in tool chaos. Now, our entire team operates from one intelligent platform. From ideation to deployment it’s all automated.",
  },
  {
    user: "Michael Wilson",
    company: "Visionary Creations",
    image: user5,
    text: "The speed, transparency, and memory-sharing capabilities blew us away. Octopus doesn’t just assist—it leads. Total game-changer for complex AI workflows.",
  },
  {
    user: "Emily Davis",
    company: "Synergy Systems",
    image: user6,
    text: "We’ve replaced 6 tools with just one Octopus. Cross-pod reasoning, agent memory, and secure execution made it the smartest decision we took all year.",
  },
];

import {
  MessageSquareCode,
  Layers3,
  Workflow,
  DatabaseZap,
  Timer,
  ShieldCheck,
} from "lucide-react";

export const features = [
  {
    icon: <MessageSquareCode />,
    text: "🧠 Natural Language to Execution",
    description:
      "Enter a single instruction—Octopus parses it, understands intent, and converts it into a structured multi-step execution plan.",
  },
  {
    icon: <Layers3 />,
    text: "🤖 Multi-Agent Architecture",
    description:
      "Modular agent pods handle different domains—each pod specializes and autonomously executes its part of the workflow.",
  },
  {
    icon: <Workflow />,
    text: "🔁 Cross-Tool Integration",
    description:
      "Connect with tools like Notion, GitHub, Slack, and Google Sheets. Octopus coordinates across them without losing context.",
  },
  {
    icon: <DatabaseZap />,
    text: "🧠 Shared Global Memory",
    description:
      "All agents operate on a common memory layer, enabling task continuity, shared context, and reuse of knowledge across pods.",
  },
  {
    icon: <Timer />,
    text: "⚡ Real-Time Orchestration",
    description:
      "Octopus dynamically routes and monitors tasks live—ensuring minimal delays and adaptive task management across agents.",
  },
  {
    icon: <ShieldCheck />,
    text: "🔒 Secure, Containerized Pods",
    description:
      "Each agent runs in an isolated, Dockerized environment—ensuring sandboxed execution and zero interference.",
  },
];

export const checklistItems = [
  {
    title: "Run workflows from one prompt",
    description:
      "Give Octopus a single instruction and watch it handle the entire execution across your tools and agent pods.",
  },
  {
    title: "Review agent actions anytime",
    description:
      "Every decision is logged transparently so you can trace exactly how, when, and why something was done.",
  },
  {
    title: "Reduce manual coordination",
    description:
      "Octopus replaces the need for back-and-forth between tools or people—agents handle the task chain autonomously.",
  },
  {
    title: "Ship updates without context loss",
    description:
      "Shared global memory ensures agents never lose track of previous work, goals, or logic—no resets, no repetition.",
  },
];

export const pricingOptions = [
  {
    title: "Free",
    price: "$0",
    features: [
      { name: "Access to Public Agent Pods", included: true },
      { name: "5 Agent Task Runs / day", included: true },
      { name: "Cross-Pod Collaboration", included: false },
      { name: "AI Memory Sharing", included: false },
      { name: "Secure Private Mode", included: false },
      { name: "Basic Usage Analytics", included: true },
    ],
  },
  {
    title: "Pro",
    price: "$10",
    features: [
      { name: "Access to Public Agent Pods", included: true },
      { name: "50 Agent Task Runs / day", included: true },
      { name: "Cross-Pod Collaboration", included: true },
      { name: "AI Memory Sharing", included: true },
      { name: "Secure Private Mode", included: true },
      { name: "Advanced Analytics Dashboard", included: true },
    ],
  },
  {
    title: "Enterprise",
    price: "$200",
    features: [
      { name: "Unlimited Agent Pods", included: true },
      { name: "Unlimited Task Execution", included: true },
      { name: "Dedicated AI Network", included: true },
      { name: "High-Speed Multi-Agent Orchestration", included: true },
      { name: "Blockchain-Powered Reasoning Logs", included: true },
      { name: "Priority Support + Custom Pod Integration", included: true },
    ],
  },
];

export const resourcesLinks = [
  { href: "#", text: "Getting Started" },
  { href: "#", text: "Documentation" },
  { href: "#", text: "Tutorials" },
  { href: "#", text: "API Reference" },
  { href: "#", text: "Community Forums" },
];

export const platformLinks = [
  { href: "#", text: "Features" },
  { href: "#", text: "Supported Devices" },
  { href: "#", text: "System Requirements" },
  { href: "#", text: "Downloads" },
  { href: "#", text: "Release Notes" },
];

export const communityLinks = [
  { href: "#", text: "Events" },
  { href: "#", text: "Meetups" },
  { href: "#", text: "Conferences" },
  { href: "#", text: "Hackathons" },
  { href: "#", text: "Jobs" },
];