"use client";

import { useSearchParams } from "next/navigation";
import { useEffect, useState, Suspense } from "react";

function DrawioEditor() {
    const searchParams = useSearchParams();
    const [iframeSrc, setIframeSrc] = useState("");

    useEffect(() => {
        // 1. தற்போதைய URL-இல் உள்ள அனைத்து பாராமீட்டர்களையும் எடுக்கிறோம்
        const params = new URLSearchParams(searchParams.toString());

    
        // 3. இதர முக்கிய தேவைகள் (உதாரணமாக: எடிட்டர் முழுமையாகத் தெரிய)
        params.set("proto", "json");

        // 4. இறுதி Iframe URL-ஐ உருவாக்குகிறோம்
        // இது /public/draw/index.html-ஐக் குறிக்கும்
        const finalUrl = `draw_io/index.html?${params.toString()}`;
        setIframeSrc(finalUrl);
    }, [searchParams]);

    return (
        <main style={{ width: "100vw", height: "100vh", overflow: "hidden" }}>
            {iframeSrc ? (
                <iframe
                    src={iframeSrc}
                    style={{
                        width: "100%",
                        height: "100%",
                        border: "none",
                    }}
                    title="Draw.io Editor"
                />
            ) : (
                <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100%' }}>
                    Loading Parameters...
                </div>
            )}
        </main>
    );
}

export default function DrawioEditorPage() {
    return (
        <Suspense fallback={<div>Loading Editor...</div>}>
            <DrawioEditor />
        </Suspense>
    );
}