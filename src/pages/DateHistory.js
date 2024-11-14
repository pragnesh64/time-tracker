import React, { useState } from "react";

const DateHistory = ({ history }) => {
  const [selectedDate, setSelectedDate] = useState("");

  const formatDate = (date) => new Date(date).toLocaleDateString();

  const filteredHistory = history.filter(
    (entry) => formatDate(entry.date) === formatDate(selectedDate)
  );

  return (
    <div className="date-history-container">
      <h3>Select Date for History</h3>
      <input
        type="date"
        value={selectedDate}
        onChange={(e) => setSelectedDate(e.target.value)}
        className="date-picker"
      />

      <div className="history-table">
        <h4>Timer History for {selectedDate || "Selected Date"}</h4>
        {filteredHistory.length > 0 ? (
          filteredHistory.map((entry, index) => (
            <div key={index}>
              <p>
                Date: {entry.date} | Start: {entry.startTime} | Pause:{" "}
                {entry.pauseTime} |{" "}
                {entry.resumeTime && `Resume: ${entry.resumeTime}`} | Duration:{" "}
                {entry.duration}
              </p>
            </div>
          ))
        ) : (
          <p>No history for this date.</p>
        )}
      </div>
    </div>
  );
};

export default DateHistory;
