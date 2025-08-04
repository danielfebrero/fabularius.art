"use client";

import { useState, useEffect } from "react";
import { useParams } from "next/navigation";
import ProfileComponent from "@/components/profile/ProfileComponent";
import { userApi } from "@/lib/api";
import { PublicUserProfile } from "@/types/user";
import { useUser } from "@/hooks/useUser";
import { ViewTracker } from "@/components/ui/ViewTracker";

export default function PublicProfilePage() {
  const params = useParams();
  const username = params.username as string;
  const [profileUser, setProfileUser] = useState<PublicUserProfile | null>(
    null
  );
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Get current user authentication status
  const { user: currentUser, loading: authLoading } = useUser();

  // Fetch user profile data
  useEffect(() => {
    const fetchUserProfile = async () => {
      if (!username || !currentUser) return;

      try {
        setLoading(true);
        setError(null);

        console.log("Fetching profile for:", username);

        const response = await userApi.getPublicProfile(username);

        if (response.success && response.data?.user) {
          setProfileUser(response.data.user);
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
  }, [username, currentUser]);

  // Authentication check: require user to be logged in to view any profile
  if (!currentUser && !authLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-xl font-semibold text-foreground">
            Authentication Required
          </h2>
          <p className="text-muted-foreground mt-2">
            You must be logged in to view this profile.
          </p>
        </div>
      </div>
    );
  }

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
    <>
      {/* Track profile view when profile is successfully loaded */}
      {profileUser && (
        <ViewTracker targetType="profile" targetId={username} />
      )}
      <ProfileComponent
        user={
          profileUser || {
            userId: "",
            createdAt: new Date().toISOString(),
          }
        }
        isOwner={false}
        loading={loading}
      />
    </>
  );
}
