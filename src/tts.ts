import { ChildProcess, exec } from "child_process";
import { platform } from "os";

let currentProcess: ChildProcess | null = null;

export function stopSpeech() {
  if (currentProcess) {
    // Force kill the speech process
    if (platform() === "win32") {
      // exec("taskkill /F /IM powershell.exe");
      exec(`taskkill /pid ${currentProcess.pid} /f /t`);
    } else if (platform() === "darwin") {
      exec("pkill say");
    } else {
      exec("pkill espeak");
    }
    currentProcess = null;
    return true;
  }
  return false;
}

export function speak(text: string): Promise<void> {
  stopSpeech(); // Stop any existing speech

  return new Promise((resolve, reject) => {
    const sanitizedText = text
      .replace(/[^\p{L}\p{N}\s.,!?;:'"()-]/gu, "") // Unicode-aware sanitization
      .replace(/"/g, '\\"') // Escape double quotes
      .replace(/'/g, "\\'") // Escape single quotes
      .trim();
    let command = "";
    if (platform() === "win32") {
      command = `powershell -Command "Add-Type -AssemblyName System.Speech; (New-Object System.Speech.Synthesis.SpeechSynthesizer).Speak('${sanitizedText}');"`;
    } else if (platform() === "darwin") {
      command = `say "${sanitizedText}"`;
    } else {
      command = `espeak "${sanitizedText}"`;
    }

    currentProcess = exec(command, (error) => {
      currentProcess = null;
      if (error) reject(error);
      else resolve();
    });
  });
}
