/**
 * Reads a browser File as an unprefixed Base64 payload.
 *
 * @param file The browser file to read.
 * @returns The Base64 payload without the data URL prefix.
 * @throws If the file cannot be read as a valid data URL.
 */
export async function fileAsBase64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();

    reader.onload = () => {
      if (typeof reader.result !== "string") {
        reject(new Error("Failed to read file as a data URL."));
        return;
      }

      const separatorIndex = reader.result.indexOf(",");

      if (separatorIndex === -1) {
        reject(new Error("Invalid file data URL."));
        return;
      }

      resolve(reader.result.slice(separatorIndex + 1));
    };

    reader.onerror = () => {
      reject(reader.error ?? new Error("Failed to read file."));
    };

    reader.readAsDataURL(file);
  });
}
