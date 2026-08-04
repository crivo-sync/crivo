"use client";

import { useRef } from "react";
import PhotoCameraOutlinedIcon from "@mui/icons-material/PhotoCameraOutlined";
import Avatar from "@mui/material/Avatar";
import Box from "@mui/material/Box";
import CircularProgress from "@mui/material/CircularProgress";
import IconButton from "@mui/material/IconButton";
import Tooltip from "@mui/material/Tooltip";

import { getInitials } from "@/lib/initials";
import {
  IMAGE_ACCEPT_ATTRIBUTE,
  validateImageFile,
} from "@/lib/image-upload";
import { useUploadAvatar } from "../../hooks/use-upload-avatar";
import { useSnackbar } from "@/components/providers/snackbar-provider";

type AvatarUploadProps = {
  name: string;
  avatarUrl: string | null;
};

export const AvatarUpload = ({ name, avatarUrl }: AvatarUploadProps) => {
  const uploadAvatar = useUploadAvatar();
  const snackbar = useSnackbar();
  const inputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    event.target.value = ""; // permite escolher o mesmo arquivo de novo depois
    if (!file) return;

    const invalid = validateImageFile(file);
    if (invalid) {
      snackbar.showError(invalid);
      return;
    }

    uploadAvatar.mutate(file);
  };

  return (
    <Box sx={{ position: "relative", width: 96, height: 96 }}>
      <Avatar
        src={avatarUrl ?? undefined}
        sx={{ width: 96, height: 96, fontSize: 32 }}
      >
        {getInitials(name)}
      </Avatar>

      {uploadAvatar.isPending && (
        <Box
          sx={{
            position: "absolute",
            inset: 0,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            bgcolor: "rgba(0,0,0,0.4)",
            borderRadius: "50%",
          }}
        >
          <CircularProgress size={28} sx={{ color: "common.white" }} />
        </Box>
      )}

      <Tooltip title="Trocar foto">
        <IconButton
          size="small"
          onClick={() => inputRef.current?.click()}
          disabled={uploadAvatar.isPending}
          sx={{
            position: "absolute",
            bottom: -4,
            right: -4,
            bgcolor: "background.paper",
            border: "1px solid",
            borderColor: "divider",
            "&:hover": { bgcolor: "background.paper" },
          }}
        >
          <PhotoCameraOutlinedIcon fontSize="small" />
        </IconButton>
      </Tooltip>

      <input
        ref={inputRef}
        type="file"
        accept={IMAGE_ACCEPT_ATTRIBUTE}
        onChange={handleFileChange}
        hidden
      />
    </Box>
  );
};
