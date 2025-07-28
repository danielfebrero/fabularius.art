"use client";

import { useState, useEffect } from "react";
import { useParams } from "next/navigation";
import ProfileComponent from "@/components/profile/ProfileComponent";

interface PublicUser {
  userId: string;
  email: string;
  username?: string;
  createdAt: string;
  isActive: boolean;
  isEmailVerified: boolean;
  lastLoginAt?: string;
  bio?: string;
  location?: string;
  website?: string;
}

export default function PublicProfilePage() {
  const params = useParams();
  const username = params.username as string;
  const [user, setUser] = useState<PublicUser | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Fetch user profile data
  useEffect(() => {
    const fetchUserProfile = async () => {
      try {
        setLoading(true);
        // Placeholder - would call API to fetch user by username
        console.log("Fetching profile for:", username);

        // Mock user data
        setTimeout(() => {
          const mockUser: PublicUser = {
            userId: `user_${username}`,
            email: `${username}@example.com`,
            username: username,
            createdAt: "2024-01-15T10:30:00Z",
            isActive: true,
            isEmailVerified: true,
            lastLoginAt: "2024-12-20T14:22:00Z",
            bio: "Photography enthusiast and digital artist. Love capturing moments and creating visual stories.",
            location: "San Francisco, CA",
            website: "https://example.com",
          };
          setUser(mockUser);
          setLoading(false);
        }, 1000);
      } catch (err) {
        console.error("Error fetching user profile:", err);
        setError("Failed to load user profile");
        setLoading(false);
      }
    };

    if (username) {
      fetchUserProfile();
    }
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
          email: "",
          createdAt: new Date().toISOString(),
        }
      }
      isOwner={false}
      loading={loading}
    />
  );
}
