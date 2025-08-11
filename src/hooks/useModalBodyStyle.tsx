import { useEffect } from "react";

export function useModalBodyStyle(open: boolean) {
  useEffect(() => {
    if (open) {
      document.body.style.overflow = "hidden";
      document.body.style.pointerEvents = "auto"; 
    } else {
      document.body.style.overflow = "auto";
      document.body.style.pointerEvents = "auto"; 
    }
    return () => {
      document.body.style.overflow = "auto";
      document.body.style.pointerEvents = "auto"; 
    };
  }, [open]);
}