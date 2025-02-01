import { ChildProcess, exec } from "child_process";
import { platform } from "os";
import { debugChannel } from "./elements/output-channel";

let currentProcess: ChildProcess | null = null;

export function stopSpeech() {
  if (currentProcess) {
    debugChannel(`stopping speech process ${currentProcess.pid}`);
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

const _sanitize = (text: string) => {
  // Allow common code symbols but remove potentially dangerous chars
  const sanitizedText = text.replace(/[^\p{L}\p{N}\s.,!?;:'"()\-=><&#]/gu, "");

  if (platform() === "win32") {
    return sanitizedText
      .replace(/"/g, '\\"') // Escape double quotes
      .replace(/'/g, "''") // Correct PowerShell single quote escape
      .trim();
  } else {
    return sanitizedText
      .replace(/"/g, '\\"') // Escape double quotes for bash
      .replace(/'/g, "") // Remove single quotes (safe in double-quoted)
      .trim();
  }
};

const _speakCommand = (text: string) => {
  if (platform() === "win32") {
    return `Add-Type -AssemblyName System.Speech; (New-Object System.Speech.Synthesis.SpeechSynthesizer).Speak('${text}')`;
  } else if (platform() === "darwin") {
    return `say "${text}"`;
  } else {
    return `espeak "${text}"`;
  }
};

export function speak(text: string): Promise<void> {
  stopSpeech(); // Stop any existing speech

  return new Promise((resolve, reject) => {
    const command = _speakCommand(_sanitize(text));

    currentProcess = exec(command, (error) => {
      debugChannel(
        `speak process ${currentProcess!.pid} exited with code ${error}`
      );
      currentProcess = null;
      if (error) reject(error);
      else resolve();
    });
    debugChannel(`speak process ${currentProcess.pid}`);
  });
}
