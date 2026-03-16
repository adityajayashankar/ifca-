import { useEffect, useRef } from "react";
import { createPortal } from "react-dom";

export default function PortalDropdown({ anchorRef, open, children }) {
  const dropdownRef = useRef(null);

  useEffect(() => {
    if (!open || !anchorRef.current || !dropdownRef.current) return;
    const anchorRect = anchorRef.current.getBoundingClientRect();
    const dropdown = dropdownRef.current;
    dropdown.style.position = "absolute";
    dropdown.style.left = `${anchorRect.left + window.scrollX}px`;
    dropdown.style.top = `${anchorRect.bottom + window.scrollY}px`;
    dropdown.style.width = `${anchorRect.width}px`;
    dropdown.style.zIndex = 9999;
  }, [open, anchorRef, children]);

  if (!open) return null;
  return createPortal(
    <div ref={dropdownRef} style={{ minWidth: 200 }}>
      {children}
    </div>,
    document.body
  );
} 