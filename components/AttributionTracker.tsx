"use client";

import { useEffect } from "react";
import { captureFirstTouch } from "@/lib/attribution";

/**
 * Capture le premier contact (referrer, landing, UTM) dans localStorage au
 * premier rendu client. Monté une fois dans le layout racine ; ne rend rien.
 */
export default function AttributionTracker() {
  useEffect(() => {
    captureFirstTouch();
  }, []);

  return null;
}
