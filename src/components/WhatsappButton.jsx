import React, { useMemo } from "react";
import { createPortal } from "react-dom";

export function WhatsappButton({
  phone = "917895807315",
  message = "Hi! I want to know more about your photo frames.",
  size = 56,
  bottom = 24,
  right = 18,
}) {
  const href = useMemo(
    () => `https://wa.me/${phone}?text=${encodeURIComponent(message)}`,
    [phone, message]
  );

  const style = {
    position: "fixed",
    bottom,
    right,
    width: size,
    height: size,
    backgroundColor: "#25D366",
    color: "#fff",
    borderRadius: 9999,
    boxShadow:
      "0 10px 15px -3px rgba(0,0,0,.1), 0 4px 6px -2px rgba(0,0,0,.05)",
    zIndex: 40,
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    transition: "transform .15s ease",
  };

  const iconSize = Math.round(size * 0.5);

  return createPortal(
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      aria-label="Chat on WhatsApp"
      title="Chat on WhatsApp"
      style={style}
      onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = "#128C7E")}
      onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = "#25D366")}
      onMouseDown={(e) => (e.currentTarget.style.transform = "scale(0.97)")}
      onMouseUp={(e) => (e.currentTarget.style.transform = "")}
    >
      <svg
        width={iconSize}
        height={iconSize}
        viewBox="0 0 24 24"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        aria-hidden="true"
      >
        <path
          d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.101-.472-.149-.67.149-.198.297-.768.966-.94 1.164-.173.198-.347.223-.644.074-.297-.149-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.521.149-.173.198-.298.298-.497.099-.198.05-.372-.025-.521-.075-.148-.669-1.612-.916-2.207-.242-.579-.487-.501-.669-.51-.173-.008-.372-.01-.571-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.017-1.04 2.48s1.065 2.876 1.213 3.073c.149.198 2.095 3.2 5.076 4.487.709.301 1.262.48 1.693.614.71.226 1.355.194 1.868.118.57-.085 1.758-.717 2.007-1.41.248-.694.248-1.287.173-1.41-.074-.124-.272-.198-.568-.347Z"
          fill="currentColor"
        />
        <path
          d="M12.002 2.002c-5.522 0-10 4.477-10 10 0 1.762.463 3.49 1.34 5.012L2 22l5.152-1.327A9.951 9.951 0 0 0 12.002 22c5.523 0 10-4.477 10-10s-4.477-10-10-10Zm0 18c-1.554 0-3.07-.403-4.415-1.166l-.316-.176-3.063.79.817-2.918-.206-.322A8.004 8.004 0 1 1 12.002 20Z"
          fill="currentColor"
        />
      </svg>

    </a>,
    document.body
  );
}
