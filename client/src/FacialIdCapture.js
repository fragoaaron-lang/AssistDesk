import React, { useEffect, useRef, useState } from 'react';

function FacialIdCapture({ value, onChange }) {
  const videoRef = useRef(null);
  const streamRef = useRef(null);
  const [cameraOpen, setCameraOpen] = useState(false);
  const [cameraError, setCameraError] = useState('');

  useEffect(() => () => {
    streamRef.current?.getTracks().forEach((track) => track.stop());
  }, []);

  const openCamera = async () => {
    setCameraError('');
    if (!navigator.mediaDevices?.getUserMedia) {
      setCameraError('Live camera capture is not available in this browser.');
      return;
    }

    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'user' }, audio: false });
      streamRef.current = stream;
      setCameraOpen(true);
      window.setTimeout(() => {
        if (videoRef.current) videoRef.current.srcObject = stream;
      }, 0);
    } catch (error) {
      setCameraError('Camera access was not granted. You can try again later from Profile.');
    }
  };

  const closeCamera = () => {
    streamRef.current?.getTracks().forEach((track) => track.stop());
    streamRef.current = null;
    setCameraOpen(false);
  };

  const capture = () => {
    const video = videoRef.current;
    if (!video || video.videoWidth === 0) return;
    const canvas = document.createElement('canvas');
    const maxDimension = 800;
    const scale = Math.min(1, maxDimension / Math.max(video.videoWidth, video.videoHeight));
    canvas.width = Math.max(1, Math.round(video.videoWidth * scale));
    canvas.height = Math.max(1, Math.round(video.videoHeight * scale));
    canvas.getContext('2d').drawImage(video, 0, 0, canvas.width, canvas.height);
    onChange(canvas.toDataURL('image/jpeg', 0.86));
    closeCamera();
  };

  return (
    <div className="facial-id-capture">
      <div className="facial-id-copy">
        <strong>Facial ID (optional)</strong>
        <small>Capture a live face snapshot for future verification. It is not required to create your account.</small>
      </div>
      {value ? (
        <div className="facial-id-preview">
          <img src={value} alt="Captured facial ID" />
          <div className="facial-id-actions">
            <span className="facial-id-status">Facial ID captured</span>
            <button type="button" className="secondary-action-button" onClick={() => { onChange(''); openCamera(); }}>Retake</button>
            <button type="button" className="secondary-action-button" onClick={() => onChange('')}>Remove</button>
          </div>
        </div>
      ) : cameraOpen ? (
        <div className="facial-id-camera">
          <div className="facial-id-camera-frame">
            <video ref={videoRef} autoPlay muted playsInline aria-label="Live facial ID camera" />
            <div className="facial-id-face-cursor" aria-hidden="true">
              <span className="facial-id-face-cursor-corner top-left" />
              <span className="facial-id-face-cursor-corner top-right" />
              <span className="facial-id-face-cursor-corner bottom-left" />
              <span className="facial-id-face-cursor-corner bottom-right" />
              <span className="facial-id-face-cursor-label">Center your face</span>
            </div>
          </div>
          <div className="facial-id-actions">
            <button type="button" className="institutional-btn small" onClick={capture}>Capture facial ID</button>
            <button type="button" className="secondary-action-button" onClick={closeCamera}>Cancel</button>
          </div>
        </div>
      ) : (
        <button type="button" className="secondary-action-button" onClick={openCamera}>Open live camera</button>
      )}
      {cameraError && <small className="facial-id-error">{cameraError}</small>}
    </div>
  );
}

export default FacialIdCapture;
