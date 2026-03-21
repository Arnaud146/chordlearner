import { Cormorant_Garamond, Manrope } from "next/font/google";

export const optionBDisplayFont = Cormorant_Garamond({
  subsets: ["latin"],
  weight: ["600", "700"],
  variable: "--font-option-b-display",
});

export const optionBBodyFont = Manrope({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  variable: "--font-option-b-body",
});

export const optionBClassNames = {
  display: "font-[family-name:var(--font-option-b-display)]",
  body: "font-[family-name:var(--font-option-b-body)]",
};

