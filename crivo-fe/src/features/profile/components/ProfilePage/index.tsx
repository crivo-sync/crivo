"use client";

import Box from "@mui/material/Box";
import Card from "@mui/material/Card";
import CardHeader from "@mui/material/CardHeader";
import Chip from "@mui/material/Chip";
import Divider from "@mui/material/Divider";
import Skeleton from "@mui/material/Skeleton";
import Stack from "@mui/material/Stack";
import Typography from "@mui/material/Typography";

import { roleLabel } from "@/components/providers/session-provider";
import { ErrorServer } from "@/components/ui/error-server";
import { useProfile } from "../../hooks/use-profile";
import { AvatarUpload } from "../AvatarUpload";
import { ProfileForm } from "../ProfileForm";
import { ChangePasswordForm } from "../ChangePasswordForm";

export const ProfilePage = () => {
  const { profile, isLoading, error, refetch } = useProfile();

  if (error) {
    return <ErrorServer message={error.message} onRetry={() => refetch()} />;
  }

  if (isLoading || !profile) {
    return (
      <Box
        sx={{
          display: "grid",
          gridTemplateColumns: { xs: "1fr", md: "1fr 1fr" },
          gap: 3,
        }}
      >
        <Card variant="outlined" sx={{ p: 3 }}>
          <Stack spacing={2.5}>
            <Skeleton variant="circular" width={96} height={96} />
            <Skeleton height={56} />
            <Skeleton height={56} />
          </Stack>
        </Card>
        <Card variant="outlined" sx={{ p: 3 }}>
          <Stack spacing={2.5}>
            <Skeleton height={56} />
            <Skeleton height={56} />
            <Skeleton height={56} />
          </Stack>
        </Card>
      </Box>
    );
  }

  return (
    <Box
      sx={{
        display: "grid",
        gridTemplateColumns: { xs: "1fr", md: "1fr 1fr" },
        gap: 3,
        alignItems: "start",
      }}
    >
      <Card variant="outlined">
        <CardHeader
          avatar={<AvatarUpload name={profile.name} avatarUrl={profile.avatarUrl} />}
          title={
            <Typography variant="subtitle1" sx={{ fontWeight: 600 }}>
              {profile.name}
            </Typography>
          }
          subheader={
            <Box sx={{ mt: 0.5 }}>
              <Chip
                size="small"
                label={roleLabel(profile.role)}
                color={profile.role === "ADMIN" ? "primary" : "default"}
              />
            </Box>
          }
        />
        <Divider />
        <Box sx={{ p: 3 }}>
          <ProfileForm profile={profile} />
        </Box>
      </Card>

      <Card variant="outlined" sx={{ p: 3 }}>
        <Typography variant="subtitle1" sx={{ fontWeight: 600, mb: 2 }}>
          Trocar senha
        </Typography>
        <ChangePasswordForm />
      </Card>
    </Box>
  );
};
