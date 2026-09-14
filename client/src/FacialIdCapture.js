import React, { useEffect, useRef, useState } from 'react';

function FacialIdCapture({ value, onChange }) {
  const cursorBounds = { left: 0.28, right: 0.72, top: 0.16, bottom: 0.84 };
  const videoRef = useRef(null);
  const streamRef = useRef(null);
  const [cameraOpen, setCameraOpen] = useState(false);
  const [cameraError, setCameraError] = useState('');
  const [captureStatus, setCaptureStatus] = useState('');

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
    const context = canvas.getContext('2d');
    context.translate(canvas.width, 0);
    context.scale(-1, 1);
    context.drawImage(video, 0, 0, canvas.width, canvas.height);
    onChange(canvas.toDataURL('image/jpeg', 0.86));
    closeCamera();
  };

  useEffect(() => {
    if (!cameraOpen) return undefined;

    let cancelled = false;
    let stableFaceFrames = 0;
    let detectionInFlight = false;
    const FaceDetectorConstructor = window.FaceDetector;
    let detector = null;
    try {
      detector = FaceDetectorConstructor ? new FaceDetectorConstructor({ fastMode: true, maxDetectedFaces: 1 }) : null;
    } catch (error) {
      detector = null;
    }
    if (!detector) {
      setCaptureStatus('Position your entire face inside the guide.');
    }

    const detectFace = async () => {
      const video = videoRef.current;
      if (cancelled || detectionInFlight || !video || video.readyState < 2 || video.videoWidth === 0) return;

      if (!detector) {
        setCaptureStatus('Position your entire face inside the guide.');
        return;
      }

      detectionInFlight = true;
      try {
        const faces = await detector.detect(video);
        const face = faces[0]?.boundingBox;
        const faceLeft = face ? face.x / video.videoWidth : 0;
        const faceRight = face ? (face.x + face.width) / video.videoWidth : 0;
        const faceTop = face ? face.y / video.videoHeight : 0;
        const faceBottom = face ? (face.y + face.height) / video.videoHeight : 0;
        const faceWidth = face ? face.width / video.videoWidth : 0;
        const faceHeight = face ? face.height / video.videoHeight : 0;
        const cursorWidth = cursorBounds.right - cursorBounds.left;
        const cursorHeight = cursorBounds.bottom - cursorBounds.top;
        const faceRatio = faceWidth / Math.max(faceHeight, 0.001);
        const cursorRatio = cursorWidth / cursorHeight;
        const isInsideCursor = Boolean(face)
          && faceLeft >= cursorBounds.left
          && faceRight <= cursorBounds.right
          && faceTop >= cursorBounds.top
          && faceBottom <= cursorBounds.bottom;
        const hasCursorProportions = faceRatio >= cursorRatio * 0.62
          && faceRatio <= cursorRatio * 1.38
          && faceWidth >= cursorWidth * 0.42
          && faceWidth <= cursorWidth * 0.92
          && faceHeight >= cursorHeight * 0.42
          && faceHeight <= cursorHeight * 0.92;
        const faceCenterX = face ? (faceLeft + faceRight) / 2 : 0;
        const faceCenterY = face ? (faceTop + faceBottom) / 2 : 0;
        const isCentered = isInsideCursor && hasCursorProportions
          && Math.abs(faceCenterX - 0.5) <= 0.10
          && Math.abs(faceCenterY - 0.5) <= 0.12;

        if (isCentered) {
          stableFaceFrames += 1;
          setCaptureStatus(stableFaceFrames >= 3 ? 'Face detected. Capturing facial ID...' : 'Hold still...');
          if (stableFaceFrames >= 3) {
            cancelled = true;
            capture();
          }
        } else {
          stableFaceFrames = 0;
          setCaptureStatus(face ? 'Entire face not inside cursor' : 'Face not detected');
        }
      } catch (error) {
        detector = null;
        setCaptureStatus('Face detection failed. No capture made.');
      } finally {
        detectionInFlight = false;
      }
    };

    const detectionTimer = window.setInterval(detectFace, 250);
    return () => {
      cancelled = true;
      window.clearInterval(detectionTimer);
    };
  }, [cameraOpen]);

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
          </div>
        </div>
      ) : cameraOpen ? (
        <div className="facial-id-camera">
          <div className="facial-id-camera-frame">
            <video className="facial-id-camera-video" ref={videoRef} autoPlay muted playsInline aria-label="Live facial ID camera" />
            <div className="facial-id-face-cursor" aria-hidden="true">
              <span className="facial-id-face-cursor-corner top-left" />
              <span className="facial-id-face-cursor-corner top-right" />
              <span className="facial-id-face-cursor-corner bottom-left" />
              <span className="facial-id-face-cursor-corner bottom-right" />
              <span className="facial-id-face-cursor-label">Center your face</span>
            </div>
          </div>
          <div className="facial-id-actions">
            <span className="facial-id-live-status" aria-live="polite">{captureStatus || 'Detecting face...'}</span>
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
