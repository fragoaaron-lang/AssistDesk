import React, { useState } from 'react';

function FacialIdCapture({ value, onChange, onSave }) {
  const [saveStatus, setSaveStatus] = useState('idle');
  const [uploadError, setUploadError] = useState('');

  const saveFacialId = async () => {
    if (!value || !onSave) return;
    setSaveStatus('saving');
    try {
      await onSave(value);
      setSaveStatus('saved');
    } catch (error) {
      setSaveStatus('error');
    }
  };

  const handleFileChange = (event) => {
    const file = event.target.files?.[0];
    if (!file) {
      setUploadError('Please choose an image file for your Facial ID.');
      return;
    }

    if (!file.type.startsWith('image/')) {
      setUploadError('The Facial ID must be an image file.');
      return;
    }

    const reader = new FileReader();
    reader.onload = () => {
      onChange(String(reader.result || ''));
      setUploadError('');
      setSaveStatus('idle');
    };
    reader.readAsDataURL(file);
  };

  return (
    <div className="facial-id-capture">
      <div className="facial-id-copy">
        <strong>Facial ID (optional)</strong>
        <small>Upload a clear face image for future verification. Live camera capture has been removed from this implementation.</small>
      </div>

      {value ? (
        <div className="facial-id-preview">
          <img src={value} alt="Captured facial ID" />
          <div className="facial-id-actions">
            <span className="facial-id-status">Facial ID captured</span>
            <label className="secondary-action-button" style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}>
              Replace image
              <input type="file" accept="image/*" onChange={handleFileChange} style={{ display: 'none' }} />
            </label>
            {onSave && (
              <button type="button" className="institutional-btn small" onClick={saveFacialId} disabled={saveStatus === 'saving' || saveStatus === 'saved'}>
                {saveStatus === 'saving' ? 'Saving...' : saveStatus === 'saved' ? 'Facial ID saved' : 'Save facial ID'}
              </button>
            )}
          </div>
        </div>
      ) : (
        <div className="facial-id-camera">
          <label className="secondary-action-button" style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', width: 'fit-content' }}>
            Upload facial ID photo
            <input type="file" accept="image/*" onChange={handleFileChange} style={{ display: 'none' }} />
          </label>
        </div>
      )}

      {uploadError && <small className="facial-id-error">{uploadError}</small>}
    </div>
  );
}

export default FacialIdCapture;
