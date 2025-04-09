"use client";

import type React from "react";
import { useState } from "react";
import { parseExcel } from "@/actions/parseexcel";
import { saveAs } from "file-saver";
import {
  Upload,
  FileUp,
  QrCode,
  Download,
  CheckCircle2,
  AlertCircle,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Toaster, toast } from "sonner";

export default function Home() {
  const [file, setFile] = useState<File | null>(null);
  const [status, setStatus] = useState<
    "idle" | "uploading" | "processing" | "complete" | "error"
  >("idle");
  const [progress, setProgress] = useState(0);
  const [theme, setTheme] = useState<"light" | "dark">("light");

  async function handleUpload(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!file) {
      toast.error("No file selected", {
        description: "Please select an Excel file first.",
      });
      return;
    }

    setStatus("uploading");
    setProgress(20);

    const formData = new FormData();
    formData.append("file", file);
    formData.append("theme", theme); // where theme is 'light' or 'dark'

    try {
      setStatus("processing");
      setProgress(50);

      const result = await parseExcel(formData);

      if ("zipBlob" in result && result.zipBlob) {
        setProgress(90);
        const blob = b64toBlob(result.zipBlob, "application/zip");
        saveAs(blob, "qr-codes.zip");

        setProgress(100);
        setStatus("complete");

        toast.success("Success!", {
          description: "Your QR codes have been generated and downloaded.",
        });
      } else {
        throw new Error(result.error || "Unknown error occurred");
      }
    } catch (error) {
      setStatus("error");
      toast.error("Error", {
        description:
          error instanceof Error
            ? error.message
            : "Failed to generate QR codes",
      });
    }
  }

  // Convert base64 to Blob
  function b64toBlob(b64Data: string, contentType = "", sliceSize = 512) {
    const byteCharacters = atob(b64Data);
    const byteArrays = [];

    for (let offset = 0; offset < byteCharacters.length; offset += sliceSize) {
      const slice = byteCharacters.slice(offset, offset + sliceSize);
      const byteNumbers = Array.from(slice).map((char) => char.charCodeAt(0));
      const byteArray = new Uint8Array(byteNumbers);
      byteArrays.push(byteArray);
    }

    return new Blob(byteArrays, { type: contentType });
  }

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setFile(e.target.files[0]);
      setStatus("idle");
      setProgress(0);
    }
  };

  const resetForm = () => {
    setFile(null);
    setStatus("idle");
    setProgress(0);
  };

  return (
    <main className="min-h-screen bg-gradient-to-b from-gray-50 to-gray-100 p-4 md:p-8 flex flex-col items-center justify-center">
      <div className="w-full max-w-3xl">
        <Card className="border-0 shadow-lg">
          <CardHeader className="bg-white rounded-t-lg border-b pb-6">
            <div className="flex items-center gap-2">
              <QrCode className="h-6 w-6 text-teal-600" />
              <CardTitle className="text-2xl font-bold text-gray-800">
                Excel to QR Code Generator
              </CardTitle>
            </div>
            <CardDescription className="text-gray-500 mt-2">
              Upload an Excel file containing tokens starting with "TG_" to
              generate QR codes and download them as a ZIP file.
            </CardDescription>
          </CardHeader>

          <CardContent className="pt-6">
            <Tabs defaultValue="upload" className="w-full">
              <TabsList className="grid grid-cols-3 mb-6">
                <TabsTrigger value="upload">Upload</TabsTrigger>
                <TabsTrigger value="process">Process</TabsTrigger>
                <TabsTrigger value="download">Download</TabsTrigger>
              </TabsList>

              <TabsContent value="upload" className="mt-0">
                <form onSubmit={handleUpload} className="space-y-6">
                  <div
                    className={`border-2 border-dashed rounded-lg p-8 text-center transition-colors ${
                      file
                        ? "border-teal-500 bg-teal-50"
                        : "border-gray-300 hover:border-gray-400"
                    }`}
                  >
                    {!file ? (
                      <div className="flex flex-col items-center justify-center space-y-4">
                        <div className="bg-gray-100 p-4 rounded-full">
                          <Upload className="h-8 w-8 text-gray-500" />
                        </div>
                        <div>
                          <p className="text-sm font-medium text-gray-700">
                            Drag and drop your Excel file here, or
                          </p>
                          <label
                            htmlFor="file-upload"
                            className="mt-2 inline-block cursor-pointer text-sm font-medium text-teal-600 hover:text-teal-500"
                          >
                            browse to upload
                          </label>
                          <input
                            id="file-upload"
                            name="file"
                            type="file"
                            accept=".xlsx,.xls"
                            className="sr-only"
                            onChange={handleFileChange}
                          />
                        </div>
                        <p className="text-xs text-gray-500">
                          Supports .xlsx and .xls files
                        </p>
                      </div>
                    ) : (
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-3">
                          <FileUp className="h-6 w-6 text-teal-600" />
                          <div className="text-left">
                            <p className="text-sm font-medium text-gray-700">
                              {file.name}
                            </p>
                            <p className="text-xs text-gray-500">
                              {(file.size / 1024).toFixed(2)} KB
                            </p>
                          </div>
                        </div>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={resetForm}
                          className="text-gray-500 hover:text-gray-700"
                        >
                          Change
                        </Button>
                      </div>
                    )}
                  </div>

                  <div className="flex flex-col justify-center items-center space-y-3">
                    <label className="text-sm font-medium text-gray-700">
                      QR Code Theme:
                    </label>
                    <div className="flex gap-4">
                      <div
                        className={`flex flex-col items-center gap-2 p-3 border-2 rounded-lg cursor-pointer transition-all ${
                          theme === "light"
                            ? "border-teal-500 bg-teal-50"
                            : "border-gray-200 hover:border-gray-300"
                        }`}
                        onClick={() => setTheme("light")}
                      >
                        <div className="w-16 h-16 bg-white border border-gray-200 rounded-md flex items-center justify-center">
                          <QrCode className="h-10 w-10 text-black" />
                        </div>
                        <span className="text-xs font-medium">
                          Black on White
                        </span>
                      </div>

                      <div
                        className={`flex flex-col items-center gap-2 p-3 border-2 rounded-lg cursor-pointer transition-all ${
                          theme === "dark"
                            ? "border-teal-500 bg-teal-50"
                            : "border-gray-200 hover:border-gray-300"
                        }`}
                        onClick={() => setTheme("dark")}
                      >
                        <div className="w-16 h-16 bg-gray-900 border border-gray-200 rounded-md flex items-center justify-center">
                          <QrCode className="h-10 w-10 text-white" />
                        </div>
                        <span className="text-xs font-medium">
                          White on Black
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="flex justify-end">
                    <Button
                      type="submit"
                      className="bg-teal-600 hover:bg-teal-700 text-white"
                      disabled={
                        !file ||
                        status === "uploading" ||
                        status === "processing"
                      }
                    >
                      {status === "uploading" || status === "processing" ? (
                        <span className="flex items-center gap-2">
                          <svg
                            className="animate-spin -ml-1 mr-2 h-4 w-4 text-white"
                            xmlns="http://www.w3.org/2000/svg"
                            fill="none"
                            viewBox="0 0 24 24"
                          >
                            <circle
                              className="opacity-25"
                              cx="12"
                              cy="12"
                              r="10"
                              stroke="currentColor"
                              strokeWidth="4"
                            ></circle>
                            <path
                              className="opacity-75"
                              fill="currentColor"
                              d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                            ></path>
                          </svg>
                          Processing...
                        </span>
                      ) : (
                        <span className="flex items-center gap-2">
                          <QrCode className="h-4 w-4" />
                          Generate QR Codes
                        </span>
                      )}
                    </Button>
                  </div>
                </form>
              </TabsContent>

              <TabsContent value="process" className="mt-0">
                <div className="space-y-6">
                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-500">Progress</span>
                      <span className="font-medium text-gray-700">
                        {progress}%
                      </span>
                    </div>
                    <Progress value={progress} className="h-2" />
                  </div>

                  <div className="space-y-4">
                    <div className="flex items-center gap-3">
                      <div
                        className={`rounded-full p-1 ${
                          status === "uploading" ||
                          status === "processing" ||
                          status === "complete"
                            ? "bg-teal-100 text-teal-600"
                            : "bg-gray-100 text-gray-400"
                        }`}
                      >
                        <Upload className="h-4 w-4" />
                      </div>
                      <div>
                        <p className="text-sm font-medium text-gray-700">
                          Uploading Excel file
                        </p>
                        <p className="text-xs text-gray-500">
                          Reading and validating your data
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-3">
                      <div
                        className={`rounded-full p-1 ${
                          status === "processing" || status === "complete"
                            ? "bg-teal-100 text-teal-600"
                            : "bg-gray-100 text-gray-400"
                        }`}
                      >
                        <QrCode className="h-4 w-4" />
                      </div>
                      <div>
                        <p className="text-sm font-medium text-gray-700">
                          Generating QR codes
                        </p>
                        <p className="text-xs text-gray-500">
                          Creating QR codes for each token
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-3">
                      <div
                        className={`rounded-full p-1 ${
                          status === "complete"
                            ? "bg-teal-100 text-teal-600"
                            : "bg-gray-100 text-gray-400"
                        }`}
                      >
                        <Download className="h-4 w-4" />
                      </div>
                      <div>
                        <p className="text-sm font-medium text-gray-700">
                          Preparing download
                        </p>
                        <p className="text-xs text-gray-500">
                          Compressing QR codes into a ZIP file
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              </TabsContent>

              <TabsContent value="download" className="mt-0">
                <div className="flex flex-col items-center justify-center py-8 space-y-4">
                  {status === "complete" ? (
                    <>
                      <div className="bg-teal-100 p-4 rounded-full">
                        <CheckCircle2 className="h-8 w-8 text-teal-600" />
                      </div>
                      <h3 className="text-lg font-medium text-gray-900">
                        QR Codes Generated Successfully!
                      </h3>
                      <p className="text-sm text-gray-500 text-center max-w-md">
                        Your QR codes have been generated and downloaded as a
                        ZIP file. If the download didn't start automatically,
                        click the button below.
                      </p>
                      <Button
                        onClick={() => {
                          if (status === "complete") {
                            const formData = new FormData();
                            if (file) formData.append("file", file);
                            formData.append("theme", theme);
                            parseExcel(formData).then((result) => {
                              if ("zipBlob" in result && result.zipBlob) {
                                const blob = b64toBlob(
                                  result.zipBlob,
                                  "application/zip"
                                );
                                saveAs(blob, "qr-codes.zip");
                              }
                            });
                          }
                        }}
                        className="bg-teal-600 hover:bg-teal-700 text-white mt-2"
                      >
                        <Download className="h-4 w-4 mr-2" />
                        Download Again
                      </Button>
                    </>
                  ) : status === "error" ? (
                    <>
                      <div className="bg-red-100 p-4 rounded-full">
                        <AlertCircle className="h-8 w-8 text-red-600" />
                      </div>
                      <h3 className="text-lg font-medium text-gray-900">
                        Something went wrong
                      </h3>
                      <p className="text-sm text-gray-500 text-center max-w-md">
                        There was an error processing your file. Please try
                        again or contact support if the issue persists.
                      </p>
                      <Button
                        onClick={resetForm}
                        className="bg-gray-600 hover:bg-gray-700 text-white mt-2"
                      >
                        Try Again
                      </Button>
                    </>
                  ) : (
                    <>
                      <div className="bg-gray-100 p-4 rounded-full">
                        <QrCode className="h-8 w-8 text-gray-400" />
                      </div>
                      <h3 className="text-lg font-medium text-gray-900">
                        No QR Codes Generated Yet
                      </h3>
                      <p className="text-sm text-gray-500 text-center max-w-md">
                        Upload an Excel file and generate QR codes to see them
                        here.
                      </p>
                    </>
                  )}
                </div>
              </TabsContent>
            </Tabs>
          </CardContent>

          <CardFooter className="bg-gray-50 rounded-b-lg border-t py-4 text-xs text-gray-500">
            <div className="w-full flex justify-between items-center">
              <p>Tokens starting with "TG_" will be converted to QR codes</p>
              <p>© {new Date().getFullYear()} QR Generator</p>
            </div>
          </CardFooter>
        </Card>
      </div>
      <Toaster position="top-right" richColors />
    </main>
  );
}
