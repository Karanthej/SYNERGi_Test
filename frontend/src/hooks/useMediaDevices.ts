import { useState, useEffect } from 'react';

export function useMediaDevices() {
  const [microphones, setMicrophones] = useState<MediaDeviceInfo[]>([]);
  const [speakers, setSpeakers] = useState<MediaDeviceInfo[]>([]);

  useEffect(() => {
    const updateDevices = async () => {
      try {
        const devices = await navigator.mediaDevices.enumerateDevices();
        const mics = devices.filter(d => d.kind === 'audioinput');
        const spks = devices.filter(d => d.kind === 'audiooutput');
        setMicrophones(mics);
        setSpeakers(spks);
      } catch (err) {
        console.error("Failed to enumerate devices", err);
      }
    };

    updateDevices();

    navigator.mediaDevices.addEventListener('devicechange', updateDevices);
    return () => navigator.mediaDevices.removeEventListener('devicechange', updateDevices);
  }, []);

  return { microphones, speakers };
}
