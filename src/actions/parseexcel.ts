'use server';

import * as XLSX from "xlsx";
import QRCode from "qrcode";
import JSZip from "jszip";

const BASE_URL = "https://airlodme.com/";

export async function parseExcel(formData: FormData) {
    const file = formData.get("file") as File;
    const theme = (formData.get("theme") as string) || "light";

    if (!file) return { error: "No file uploaded" };

    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    const workbook = XLSX.read(buffer, { type: "buffer" });
    const sheetName = workbook.SheetNames[0];
    const sheet = workbook.Sheets[sheetName];
    const data = XLSX.utils.sheet_to_json(sheet, { header: 1 });

    const tokens = data
        .flat()
        .map((cell) => String(cell).trim())
        .filter((token) => token.startsWith("TG_"));

    const zip = new JSZip();

    await Promise.all(
        tokens.map(async (token) => {
            const link = `${BASE_URL}${token}`;

            const svgString = await QRCode.toString(link, {
                type: "svg",
                margin: 0, // remove padding around QR
                color: {
                    dark: theme === "dark" ? "#ffffff" : "#000000",
                    light: theme === "dark" ? "#000000" : "#ffffff",
                },
            });

            // Extract QR code dimensions
            const viewBoxMatch = svgString.match(/viewBox="0 0 (\d+) (\d+)"/);
            const qrSize = viewBoxMatch ? parseInt(viewBoxMatch[1]) : 256;
            const textHeight = 40;
            const totalHeight = qrSize + textHeight;

            const cleanedSvg = svgString
                .replace(/<\?xml[^>]*\?>/, "")
                .replace(/<!DOCTYPE[^>]*>/, "")
                .replace(/(width|height)="[^"]*"/g, (match, group) =>
                    group === "width"
                        ? `width="${qrSize}"`
                        : `height="${totalHeight}"`
                )
                .replace(
                    /viewBox="[^"]*"/,
                    `viewBox="0 0 ${qrSize} ${totalHeight}"`
                )
                .replace(
                    "</svg>",
                    `<text
                        x="50%"
                        y="${qrSize + 30}"
                        text-anchor="middle"
                        font-family="Arial, sans-serif"
                        font-size="${Math.min(qrSize * 0.12, 20)}"
                        textLength="${qrSize * 0.9}"
                        lengthAdjust="spacing"
                        font-weight="bold"
                        fill="${theme === "dark" ? "#ffffff" : "#000000"}"
                    >${token}</text>
</svg>`
                );

            zip.file(`qr_${token}.eps`, cleanedSvg); // save as EPS extension
        })
    );

    const zipBlob = await zip.generateAsync({ type: "base64" });

    return { zipBlob };
}
