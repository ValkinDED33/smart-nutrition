import { Box } from "@mui/material";
import { PacmanLoader as Spinner } from "react-spinners";

interface PacmanLoaderProps {
  fullScreen?: boolean;
  size?: number;
}

const PacmanLoader = ({ fullScreen = true, size = 100 }: PacmanLoaderProps) => {
  return (
    <Box
      sx={{
        minHeight: fullScreen ? "100vh" : "auto",
        width: "100%",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        backgroundColor: fullScreen
          ? (theme) =>
              theme.palette.mode === "dark"
                ? "rgba(0,0,0,0.6)"
                : "rgba(255,255,255,0.6)"
          : "transparent",
        backdropFilter: fullScreen ? "blur(4px)" : "none",
      }}
    >
      <Spinner
        size={size / 5}
        color="#FFD700"
      />
    </Box>
  );
};

export default PacmanLoader;
