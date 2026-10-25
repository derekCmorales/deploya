import type { ReactNode } from "react";

import { SoloEnNube } from "./solo-en-nube";

/** Todo el grupo `(billing)` (06–09) existe solo en la nube. */
export default function BillingLayout({ children }: { children: ReactNode }) {
  return <SoloEnNube>{children}</SoloEnNube>;
}
