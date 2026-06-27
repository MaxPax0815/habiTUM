import { Box, Dialog } from "@mui/material";

// ---------------------------------------------------------------------------
// AppDialog
// Reusable popup wrapper for forms or custom content.
// The caller controls open/close state and passes the content as children.
// ---------------------------------------------------------------------------

const AppDialog = ({
  children,
  open,
  onClose,
  fullWidth = true,
  maxWidth = "sm",
  contentSx = {},
  slotProps = {},
  ...dialogProps
}) => {
  const { backdrop: backdropSlotProps = {}, paper: paperSlotProps = {}, ...otherSlotProps } = slotProps;

  return (
    <Dialog
      open={open}
      onClose={onClose}
      fullWidth={fullWidth}
      maxWidth={maxWidth}
      slotProps={{
        ...otherSlotProps,
        backdrop: {
          ...backdropSlotProps,
          sx: {
            backdropFilter: "blur(4px)", // blurs the dashboard behind it
            backgroundColor: "rgba(15,23,42,0.25)", // slight dim so the card pops
            ...backdropSlotProps.sx,
          },
        },
        paper: {
          ...paperSlotProps,
          sx: {
            borderRadius: 3,
            ...paperSlotProps.sx,
          },
        },
      }}
      {...dialogProps}
    >
      <Box sx={{ p: { xs: 2.5, sm: 3 }, ...contentSx }}>
        {children}
      </Box>
    </Dialog>
  );
};

export default AppDialog;
