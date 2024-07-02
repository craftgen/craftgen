import { useEffect, useState } from "react";

const useHealthStatus = (interval = 30000) => {
  const [isHealthy, setIsHealthy] = useState<boolean>(false);

  useEffect(() => {
    const checkHealth = async () => {
      try {
        const response = await fetch("http://localhost:24321/_internal/health");
        const data = await response.json();
        console.log("Health check result:", data);
        setIsHealthy(data.message === "ok");
      } catch (error) {
        console.error("Health check failed:", error);
        setIsHealthy(false);
      }
    };

    // Initial check
    checkHealth();

    // Set up interval for periodic checks
    const intervalId = setInterval(checkHealth, interval);

    // Clean up on unmount
    return () => clearInterval(intervalId);
  }, [interval]);

  return isHealthy;
};

export default useHealthStatus;
