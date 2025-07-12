"use client";

import { useRouter } from "next/navigation";
import { Button } from "../../../components/ui/Button";

export function AlbumActions() {
  const router = useRouter();

  const handleBackClick = () => {
    router.back();
  };

  return (
    <div className="flex items-center justify-between">
      <Button
        variant="outline"
        onClick={handleBackClick}
        className="flex items-center space-x-2"
      >
        <svg
          className="w-4 h-4"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M15 19l-7-7 7-7"
          />
        </svg>
        <span>Back</span>
      </Button>
    </div>
  );
}
