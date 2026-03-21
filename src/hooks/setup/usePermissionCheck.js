import { useState, useEffect} from "react";

export function usePermissionCheck() {
  const [isChecking, setIsChecking] = useState(true);
  const [perms, setPerms] = useState({
    mic: false,
    cam: false,
    checked: false,
  });

  useEffect(() => {
    let isMounted = true;

    const checkPerms = async () => {
      let mic = false,
        cam = false;
      try {
        // Try both first to trigger a single combined browser prompt
        const stream = await navigator.mediaDevices.getUserMedia({
          video: true,
          audio: true,
        });
        stream.getTracks().forEach((t) => t.stop());
        mic = true;
        cam = true;
      } catch (err) {
        // Fallback: Try individually
        try {
          const aStream = await navigator.mediaDevices.getUserMedia({
            audio: true,
          });
          aStream.getTracks().forEach((t) => t.stop());
          mic = true;
        } catch (e) {}
        try {
          const vStream = await navigator.mediaDevices.getUserMedia({
            video: true,
          });
          vStream.getTracks().forEach((t) => t.stop());
          cam = true;
        } catch (e) {}
      }

      if (isMounted) {
        setPerms({ mic, cam, checked: true });
        setIsChecking(false);
      }
    };

    checkPerms();
    return () => {
      isMounted = false;
    };
  }, []);

  return { isChecking, perms };
}