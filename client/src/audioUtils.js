export const playLoginBell = ({ duration = 0.8 } = {}) => {
  const AudioContextClass = window.AudioContext || window.webkitAudioContext;
  if (!AudioContextClass) return;

  try {
    const context = new AudioContextClass();
    const oscillator = context.createOscillator();
    const gainNode = context.createGain();

    oscillator.type = 'triangle';
    oscillator.frequency.setValueAtTime(880, context.currentTime);
    oscillator.frequency.exponentialRampToValueAtTime(660, context.currentTime + 0.28);

    gainNode.gain.setValueAtTime(0.0001, context.currentTime);
    gainNode.gain.exponentialRampToValueAtTime(0.15, context.currentTime + 0.04);
    gainNode.gain.exponentialRampToValueAtTime(0.0001, context.currentTime + duration);

    oscillator.connect(gainNode);
    gainNode.connect(context.destination);

    oscillator.start();
    oscillator.stop(context.currentTime + duration);
    oscillator.onended = () => {
      context.close();
    };
  } catch (error) {
    console.warn('Unable to play login bell sound.', error);
  }
};

let notificationSoundQueue = Promise.resolve();

const playNotificationChime = async () => {
  const AudioContextClass = window.AudioContext || window.webkitAudioContext;
  if (!AudioContextClass) return;

  let context;
  try {
    context = new AudioContextClass();
    if (context.state === 'suspended') await context.resume();

    const notes = [1046.5, 1318.5];
    const startAt = context.currentTime;
    await new Promise((resolve) => {
      let remainingNotes = notes.length;
      notes.forEach((frequency, index) => {
        const noteStart = startAt + index * 0.075;
        const oscillator = context.createOscillator();
        const gainNode = context.createGain();
        oscillator.type = 'sine';
        oscillator.frequency.setValueAtTime(frequency, noteStart);
        gainNode.gain.setValueAtTime(0.0001, noteStart);
        gainNode.gain.exponentialRampToValueAtTime(0.095, noteStart + 0.012);
        gainNode.gain.exponentialRampToValueAtTime(0.0001, noteStart + 0.19);
        oscillator.connect(gainNode);
        gainNode.connect(context.destination);
        oscillator.onended = () => {
          remainingNotes -= 1;
          if (remainingNotes === 0) resolve();
        };
        oscillator.start(noteStart);
        oscillator.stop(noteStart + 0.2);
      });
    });
  } catch (error) {
    // Audio can be blocked by browser/device settings; notifications still work.
  } finally {
    if (context && context.state !== 'closed') await context.close().catch(() => {});
  }
};

export const queueNotificationChimes = (count = 1) => {
  const soundCount = Math.min(20, Math.max(0, Math.floor(Number(count) || 0)));
  for (let index = 0; index < soundCount; index += 1) {
    notificationSoundQueue = notificationSoundQueue
      .then(playNotificationChime)
      .catch(() => {});
  }
  return notificationSoundQueue;
};
