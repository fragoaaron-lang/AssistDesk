import React, { useEffect, useRef, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useAuth } from './AuthContext';

const readImage = (file) => new Promise((resolve, reject) => {
  const reader = new FileReader();
  reader.onload = () => resolve(String(reader.result || ''));
  reader.onerror = reject;
  reader.readAsDataURL(file);
});

function RegistrationVerificationPage() {
  const { verificationToken } = useParams();
  const { completeRegistration } = useAuth();
  const navigate = useNavigate();
  const videoRef = useRef(null);
  const streamRef = useRef(null);
  const detectorRef = useRef(null);
  const detectionFrameRef = useRef(null);
  const [idDocument, setIdDocument] = useState('');
  const [selfie, setSelfie] = useState('');
  const [step, setStep] = useState('id');
  const [status, setStatus] = useState('');
  const [error, setError] = useState('');
  const [cameraSupported, setCameraSupported] = useState(true);

  useEffect(() => () => {
    if (detectionFrameRef.current) cancelAnimationFrame(detectionFrameRef.current);
    streamRef.current?.getTracks().forEach((track) => track.stop());
  }, []);

  const captureSelfie = () => {
    const video = videoRef.current;
    if (!video || video.readyState < 2) return;
    const canvas = document.createElement('canvas');
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    const context = canvas.getContext('2d');
    context.translate(canvas.width, 0);
    context.scale(-1, 1);
    context.drawImage(video, 0, 0, canvas.width, canvas.height);
    const image = canvas.toDataURL('image/jpeg', 0.88);
    setSelfie(image);
    setStatus('Face captured. Submitting identity verification...');
    streamRef.current?.getTracks().forEach((track) => track.stop());
    return image;
  };

  const submitVerification = async (image) => {
    try {
      await completeRegistration(verificationToken, idDocument, image);
      navigate('/dashboard', { replace: true });
    } catch (verificationError) {
      setError(verificationError.response?.data?.message || 'Identity verification failed. Registration was not completed.');
      setStatus('');
      setStep('failed');
    }
  };

  const detectFace = () => {
    const video = videoRef.current;
    const detector = detectorRef.current;
    if (!video || !detector || selfie) return;

    detector.detect(video).then((faces) => {
      if (faces.length === 1) {
        const image = captureSelfie();
        if (image) submitVerification(image);
        return;
      }
      setStatus(faces.length > 1 ? 'Only one face may be visible.' : 'Center your face inside the frame.');
      detectionFrameRef.current = requestAnimationFrame(detectFace);
    }).catch(() => {
      setStatus('Keep your face centered, then use Capture face.');
    });
  };

  const startCamera = async () => {
    setError('');
    setStatus('Requesting camera access...');
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'user' }, audio: false });
      streamRef.current = stream;
      videoRef.current.srcObject = stream;
      await videoRef.current.play();
      if ('FaceDetector' in window) {
        detectorRef.current = new window.FaceDetector({ fastMode: true, maxDetectedFaces: 2 });
        setStatus('Center your face. Capture will submit automatically.');
        detectFace();
      } else {
        setCameraSupported(false);
        setStatus('Center your face inside the frame, then capture it.');
      }
    } catch (cameraError) {
      setError('Camera access is required for facial verification. Check your browser permissions and try again.');
      setStatus('');
    }
  };

  const handleIdUpload = async (event) => {
    const file = event.target.files?.[0];
    if (!file || !file.type.startsWith('image/')) {
      setError('Upload a clear image of a valid ID.');
      return;
    }
    setError('');
    setIdDocument(await readImage(file));
    setStep('face');
    setStatus('ID uploaded. Start facial verification next.');
  };

  const handleManualCapture = () => {
    const image = captureSelfie();
    if (image) submitVerification(image);
  };

  return (
    <main className="auth-shell">
      <div className="auth-card verification-card">
        <div className="auth-hero">
          <div className="brand-badge" style={{ width: '72px', height: '72px', marginBottom: '14px', background: 'rgba(255,255,255,0.18)' }}>
            <img src="/assistdesk-logo.svg" alt="AssistDesk logo" />
          </div>
          <p className="auth-kicker">Secure registration</p>
          <h2>Verify your identity</h2>
          <p>Upload a valid Tomas Claudio Colleges (TCC) school ID first. The name and student number must match your registration form, then center your face in the guide.</p>
        </div>
        <div className="auth-form verification-form">
          <div className={`verification-step ${step === 'id' ? 'active' : 'complete'}`}>
            <span>1</span><strong>Upload your TCC school ID</strong>
            {step === 'id' ? <label className="secondary-action-button verification-upload">Choose ID image<input type="file" accept="image/*" onChange={handleIdUpload} /></label> : <small>ID image ready</small>}
          </div>
          {step !== 'id' && step !== 'failed' && (
            <div className="verification-step active">
              <span>2</span><strong>Center your face</strong>
              <div className="verification-camera-frame">
                <video ref={videoRef} className="verification-camera" autoPlay muted playsInline />
                <div className="verification-face-cursor" aria-hidden="true"><i /><i /><i /><i /></div>
              </div>
              <small>{status || 'Allow camera access to begin.'}</small>
              {!streamRef.current && <button type="button" className="institutional-btn" onClick={startCamera}>Start facial verification</button>}
              {streamRef.current && !cameraSupported && <button type="button" className="institutional-btn" onClick={handleManualCapture}>Capture face</button>}
            </div>
          )}
          {step === 'failed' && <div className="verification-failure"><strong>Registration stopped</strong><p>{error}</p><button type="button" className="institutional-btn" onClick={() => navigate('/')}>Return to sign in</button></div>}
          {error && step !== 'failed' && <p className="facial-id-error">{error}</p>}
          {status && step !== 'face' && <p className="helper-text">{status}</p>}
        </div>
      </div>
    </main>
  );
}

export default RegistrationVerificationPage;