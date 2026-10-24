let audioPlayer = null;
let isAudioConfigured = false;
let autoStopTimer = null;

export async function initAudioMode() {
  if (isAudioConfigured) return;
  try {
    const { setAudioModeAsync, setIsAudioActiveAsync } = require('expo-audio');
    if (setIsAudioActiveAsync) {
      await setIsAudioActiveAsync(true);
    }
    if (setAudioModeAsync) {
      await setAudioModeAsync({
        playsInSilentMode: true,
        shouldPlayInBackground: true,
        interruptionMode: 'doNotMix',
      });
    }
    isAudioConfigured = true;
    console.log('[KDS Sound] Native Audio Mode Configured: playsInSilentMode=true');
  } catch (err) {
    console.warn('[KDS Sound] Audio mode init warning:', err.message);
  }
}

function getOrCreatePlayer() {
  if (audioPlayer) return audioPlayer;
  try {
    const { createAudioPlayer } = require('expo-audio');
    // High-pitched loud piercing siren
    audioPlayer = createAudioPlayer(require('../../assets/sounds/loud_siren.ogg'));
    audioPlayer.volume = 1.0;
    audioPlayer.loop = true;
    return audioPlayer;
  } catch (err1) {
    try {
      const { createAudioPlayer } = require('expo-audio');
      audioPlayer = createAudioPlayer(require('../../assets/sounds/high_pitch_alert.wav'));
      audioPlayer.volume = 1.0;
      audioPlayer.loop = true;
      return audioPlayer;
    } catch (err2) {
      console.warn('[KDS Sound] Player creation error:', err2.message);
      return null;
    }
  }
}

/**
 * Plays the loud alarm siren for exactly durationMs (default: 3000ms / 3 seconds).
 * After 3 seconds, it automatically stops so it never rings endlessly.
 */
export async function playLoudAlarmSound(durationMs = 3000) {
  try {
    if (autoStopTimer) {
      clearTimeout(autoStopTimer);
      autoStopTimer = null;
    }

    await initAudioMode();
    const player = getOrCreatePlayer();
    if (player) {
      player.volume = 1.0;
      player.loop = true;
      player.seekTo(0).catch(() => {});
      player.play();

      // Automatically cut off sound after exactly durationMs (3 seconds)
      if (durationMs > 0) {
        autoStopTimer = setTimeout(() => {
          stopLoudAlarmSound();
        }, durationMs);
      }
    }
  } catch (err) {
    console.warn('[KDS Sound] Play error:', err.message);
  }
}

export function stopLoudAlarmSound() {
  try {
    if (autoStopTimer) {
      clearTimeout(autoStopTimer);
      autoStopTimer = null;
    }
    if (audioPlayer) {
      audioPlayer.pause();
    }
  } catch (err) {
    console.warn('[KDS Sound] Stop error:', err.message);
  }
}

// Backward compatibility alias
export const playHighPitchAlert = playLoudAlarmSound;
export const stopHighPitchAlert = stopLoudAlarmSound;
