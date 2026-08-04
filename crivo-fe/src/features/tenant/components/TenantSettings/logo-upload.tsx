"use client";

import { useRef } from "react";
import ImageOutlinedIcon from "@mui/icons-material/ImageOutlined";
import UploadOutlinedIcon from "@mui/icons-material/UploadOutlined";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import CircularProgress from "@mui/material/CircularProgress";
import Stack from "@mui/material/Stack";
import Typography from "@mui/material/Typography";

import { useSnackbar } from "@/components/providers/snackbar-provider";
import {
  IMAGE_ACCEPT_ATTRIBUTE,
  validateImageFile,
} from "@/lib/image-upload";
import { useUploadLogo } from "../../hooks/use-upload-logo";

type LogoUploadProps = {
  logoUrl: string | null;
  disabled?: boolean;
};

export const LogoUpload = ({ logoUrl, disabled = false }: LogoUploadProps) => {
  const uploadLogo = useUploadLogo();
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

    uploadLogo.mutate(file);
  };

  return (
    <Box>
      <Typography variant="subtitle2" sx={{ mb: 1.5 }}>
        Logo da clínica
      </Typography>

      <Stack
        spacing={2}
        sx={{
          flexDirection: "row",
          alignItems: "center",
          flexWrap: "wrap",
          rowGap: 1.5,
        }}
      >
        {/* Retângulo (não círculo como o avatar): um logo costuma ser um
            wordmark largo, e recortá-lo em círculo cortaria o nome. */}
        <Box
          sx={{
            position: "relative",
            width: 140,
            height: 72,
            flexShrink: 0,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            border: "1px solid",
            borderColor: "divider",
            borderRadius: 1,
            bgcolor: "background.default",
            overflow: "hidden",
          }}
        >
          {logoUrl ? (
            // `<img>` puro em vez de next/image: a URL do Cloudinary é
            // dinâmica por tenant e não está em images.remotePatterns.
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={logoUrl}
              alt="Logo da clínica"
              style={{
                maxWidth: "100%",
                maxHeight: "100%",
                objectFit: "contain",
              }}
            />
          ) : (
            <ImageOutlinedIcon sx={{ color: "text.disabled" }} />
          )}

          {uploadLogo.isPending && (
            <Box
              sx={{
                position: "absolute",
                inset: 0,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                bgcolor: "rgba(0,0,0,0.4)",
              }}
            >
              <CircularProgress size={24} sx={{ color: "common.white" }} />
            </Box>
          )}
        </Box>

        {!disabled && (
          <Stack spacing={0.5} sx={{ alignItems: "flex-start", minWidth: 0 }}>
            <Button
              variant="outlined"
              size="small"
              startIcon={<UploadOutlinedIcon />}
              onClick={() => inputRef.current?.click()}
              disabled={uploadLogo.isPending}
            >
              {logoUrl ? "Trocar logo" : "Enviar logo"}
            </Button>
            <Typography
              variant="caption"
              sx={{ color: "text.secondary", whiteSpace: "normal" }}
            >
              JPEG, PNG ou WebP, até 5MB.
            </Typography>
          </Stack>
        )}
      </Stack>

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
