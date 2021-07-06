import React from "react";

export const Comments: React.FC = () => (
    <section
        style={{
            width: "90%",
            maxWidth: 700,
            margin: "0 auto",
        }}
        ref={(elem) => {
            if (!elem || elem.childNodes.length) {
                return;
            }
            const scriptElem = document.createElement("script");
            scriptElem.src = "https://utteranc.es/client.js";
            scriptElem.async = true;
            scriptElem.crossOrigin = "anonymous";
            scriptElem.setAttribute("repo", "senaarth/spaceTraveling");
            scriptElem.setAttribute("issue-term", "pathname");
            scriptElem.setAttribute("label", "blog-comment");
            scriptElem.setAttribute("theme", "github-light");
            elem.appendChild(scriptElem);
        }}
    />
);
