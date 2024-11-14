import React, { useState } from 'react';

// Popup component
const Popup = ({ onClose }) => {
  const [text, setText] = useState(''); // State to store text input

  const handleChange = (e) => {
    setText(e.target.value); // Update the text state
  };

  const handleSubmit = () => {
    if (text.trim()) {
      onClose(text); // Pass the text back to the parent on submit
    }
  };

  return (
    <div className="popup-overlay">
      <div className="popup">
        <h2>Write Your Name</h2>
        <input
          type="text"
          value={text}
          onChange={handleChange}
          placeholder="Enter your name"
        />
        <div className="popup-buttons">
          <button
            disabled={!text.trim()} // Disable if text is empty
            onClick={handleSubmit}
          >
            Submit
          </button>
        </div>
      </div>
    </div>
  );
};

export default Popup;
