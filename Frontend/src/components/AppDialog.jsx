import { Box, Dialog } from '@mui/material'

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
  maxWidth = 'sm',
  contentSx = {},
  slotProps = {},
  ...dialogProps
}) => {
  return (
    <Dialog
      open={open}
      onClose={onClose}
      fullWidth={fullWidth}
      maxWidth={maxWidth}
      slotProps={slotProps}
      {...dialogProps}
    >
      <Box sx={{ p: { xs: 2.5, sm: 3 }, ...contentSx }}>
        {children}
      </Box>
    </Dialog>
  );
}

export default AppDialog
