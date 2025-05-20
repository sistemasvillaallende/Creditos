import { useEffect, useRef } from "react";

const HeaderRemoto = () => {
  const headerContainerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // Cargar el CSS
    const link = document.createElement("link");
    link.rel = "stylesheet";
    link.href = "http://10.0.0.24/header_back/header.css";
    document.head.appendChild(link);

    // Cargar el HTML del header
    fetch("http://10.0.0.24/header_back/index.html")
      .then((response) => response.text())
      .then((html) => {
        const container = document.createElement("div");
        container.innerHTML = html;

        const header = container.querySelector("header");
        if (header && headerContainerRef.current) {
          // Reemplazar rutas relativas de imágenes
          header.querySelectorAll("img").forEach((img) => {
            if (!img.src.startsWith("http")) {
              img.src =
                "http://10.0.0.24/header_back/" + img.getAttribute("src");
            }
          });

          // Limpiar el contenedor antes de insertar el nuevo header
          headerContainerRef.current.innerHTML = "";
          headerContainerRef.current.appendChild(header);

          // Cargar el JS luego de insertar el header
          const script = document.createElement("script");
          script.src = "http://10.0.0.24/header_back/header.js";
          script.async = true;
          headerContainerRef.current.appendChild(script);
        }
      });

    // Limpieza al desmontar componente
    return () => {
      if (headerContainerRef.current) {
        headerContainerRef.current.innerHTML = "";
      }
      const css = document.querySelector(
        'link[href="http://10.0.0.24/header_back/header.css"]'
      );
      if (css) css.remove();
    };
  }, []);

  return <div ref={headerContainerRef} />;
};

export default HeaderRemoto;
