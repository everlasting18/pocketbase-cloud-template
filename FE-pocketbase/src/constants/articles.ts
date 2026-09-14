/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from "react";
import type { JournalArticle } from "@/types";

export const JOURNAL_ARTICLES: JournalArticle[] = [
    {
        id: 1,
        title: "The Psychology of Texture",
        date: "April 12, 2025",
        excerpt: "Why our fingertips crave natural surfaces in a world of glass and plastic.",
        image: "https://images.unsplash.com/photo-1617791160505-6f00504e3519?auto=format&fit=crop&q=80&w=1000",
        content: React.createElement(React.Fragment, null,
            React.createElement("p", { className: "mb-6 first-letter:text-5xl first-letter:leading-none first-letter:font-serif first-letter:mr-3 first-letter:float-left text-[#5D5A53]" },
                "We live in a frictionless world. Our phones are smooth glass, our laptops polished aluminum, our countertops engineered quartz. There is no resistance, no grit, no grain. And yet, our biology craves it."
            ),
            React.createElement("p", { className: "mb-8 text-[#5D5A53]" },
                "The fingertips are among the most densely innervated parts of the human body. They are designed to read the story of an object—its age, its origin, its temperature. When we deny them this input, we experience a subtle form of sensory deprivation."
            ),
            React.createElement("blockquote", { className: "border-l-2 border-[#2C2A26] pl-6 italic text-xl text-[#2C2A26] my-10 font-serif" },
                "\"To touch is to know. To feel is to be grounded.\""
            ),
            React.createElement("p", { className: "mb-6 text-[#5D5A53]" },
                "At Aura, we design for the hand as much as for the eye. We choose materials that have a voice. Sandstone that warms under your palm. Fabric that has a weave you can trace. Wood that remembers the forest."
            )
        )
    },
    {
        id: 2,
        title: "Living with Less",
        date: "March 28, 2025",
        excerpt: "A conversation with architect Hiroshi Nakamura on the art of empty space.",
        image: "https://images.unsplash.com/photo-1494438639946-1ebd1d20bf85?auto=format&fit=crop&q=80&w=1000",
        content: React.createElement(React.Fragment, null,
            React.createElement("p", { className: "mb-6 text-[#5D5A53]" },
                "Emptiness is not nothing. In Japanese architecture, the concept of ",
                React.createElement("em", null, "Ma"),
                " refers to the space between things—the pause that gives shape to the whole."
            ),
            React.createElement("p", { className: "mb-8 text-[#5D5A53]" },
                "\"We tend to fill our lives with noise,\" Nakamura says, sipping tea in his studio overlooking the rain-slicked streets of Kyoto. \"We buy more devices to save time, but we end up with less time than ever. True luxury is the absence of intrusion.\""
            ),
            React.createElement("div", { className: "my-12 p-8 bg-[#EBE7DE] font-serif text-[#2C2A26] italic text-center" },
                React.createElement("p", null, "The room is empty"),
                React.createElement("p", null, "But full of light."),
                React.createElement("p", null, "The mind is quiet"),
                React.createElement("p", null, "But full of thought."),
                React.createElement("p", null, "This is the weight"),
                React.createElement("p", null, "Of living with less.")
            ),
            React.createElement("p", { className: "mb-6 text-[#5D5A53]" },
                "This philosophy drives every curve of our new collection. We asked ourselves: what can we remove? How much can we take away until only the essential remains?"
            )
        )
    },
    {
        id: 3,
        title: "Spring Moodboard",
        date: "March 15, 2025",
        excerpt: "Notes from the design studio: morning mist, wet stone, and pale linen.",
        image: "https://images.unsplash.com/photo-1516834474-48c0abc2a902?auto=format&fit=crop&q=80&w=1000",
        content: React.createElement(React.Fragment, null,
            React.createElement("p", { className: "mb-6 text-[#5D5A53]" },
                "Spring in the studio is a time of awakening. The light shifts from the harsh, low angles of winter to a softer, diffused glow. We find ourselves drawn to paler tones—the grey of wet pavement, the cream of unbleached linen, the dusty green of sage."
            ),
            React.createElement("p", { className: "mb-8 text-[#5D5A53]" },
                "Our moodboard this month is a study in softness. It is about the transition state—neither cold nor hot, neither dark nor bright. It is the dawn of the year."
            ),
             React.createElement("div", { className: "my-12 p-8 bg-[#2C2A26] text-[#F5F2EB] font-serif italic text-center" },
                React.createElement("p", null, "Green sprout pushing through"),
                React.createElement("p", null, "Grey stone cold against the skin"),
                React.createElement("p", null, "The sun warms the air.")
            )
        )
    }
];
