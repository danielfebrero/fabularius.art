"use client";

import { useState, useEffect } from "react";
import { useParams } from "next/navigation";
import ProfileComponent from "@/components/profile/ProfileComponent";
import { userApi } from "@/lib/api";
import { PublicUserProfile } from "@/types/user";

export default function PublicProfilePage() {
  const params = useParams();
  const username = params.username as string;
  const [user, setUser] = useState<PublicUserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Fetch user profile data
  useEffect(() => {
    const fetchUserProfile = async () => {
      if (!username) return;

      try {
        setLoading(true);
        setError(null);

        console.log("Fetching profile for:", username);

        const response = await userApi.getPublicProfile(username);

        if (response.success && response.data?.user) {
          setUser(response.data.user);
        } else {
          setError(response.error || "Failed to load user profile");
        }
      } catch (err) {
        console.error("Error fetching user profile:", err);
        if (err instanceof Error) {
          setError(err.message);
        } else {
          setError("Failed to load user profile");
        }
      } finally {
        setLoading(false);
      }
    };

    fetchUserProfile();
  }, [username]);

  // Error state
  if (error) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-xl font-semibold text-foreground">
            Profile not found
          </h2>
          <p className="text-muted-foreground mt-2">
            The user profile you&apos;re looking for doesn&apos;t exist or has
            been made private.
          </p>
        </div>
      </div>
    );
  }

  return (
    <ProfileComponent
      user={
        user || {
          userId: "",
          createdAt: new Date().toISOString(),
        }
      }
      isOwner={false}
      loading={loading}
    />
  );
}
