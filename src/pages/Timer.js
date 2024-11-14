import React, { useState, useEffect } from "react";
import * as XLSX from "xlsx";
import DateHistory from "./DateHistory";
import Popup from "./Popup";

const TimerButtons = () => {
  const [isPopupOpen, setIsPopupOpen] = useState(true); 
  const [name, setName] = useState(''); 

  useEffect(() => {
    
    const storedName = localStorage.getItem('userName');
    if (storedName) {
      setName(storedName); 
      setIsPopupOpen(false); 
    }
  }, []);

  const closePopup = (text) => {
    setName(text); 
    localStorage.setItem('userName', text); 
    setIsPopupOpen(false); 
  };



  const [running, setRunning] = useState(false);
  const [paused, setPaused] = useState(false);
  const [elapsedTime, setElapsedTime] = useState(0);
  const [startTime, setStartTime] = useState(null);
  const [intervalId, setIntervalId] = useState(null);
  const [history, setHistory] = useState([]);

  const formatTime = (milliseconds) => {
    const totalSeconds = Math.floor(milliseconds / 1000);
    const hours = String(Math.floor(totalSeconds / 3600)).padStart(2, "0");
    const minutes = String(Math.floor((totalSeconds % 3600) / 60)).padStart(2, "0");
    const seconds = String(totalSeconds % 60).padStart(2, "0");

    return `${hours}:${minutes}:${seconds}`;
  };

  const startTimer = () => {
    setRunning(true);
    setPaused(false);
    setStartTime(new Date().getTime());
    const id = setInterval(() => {
      setElapsedTime((prevElapsed) => prevElapsed + 1000);
    }, 1000);
    setIntervalId(id);
  };

  const stopTimer = () => {
    clearInterval(intervalId);
    setRunning(false);
    setPaused(true);
    const currentTime = new Date().getTime();
    const pausedDuration = currentTime - startTime;
    setElapsedTime((prevElapsed) => prevElapsed + pausedDuration);

    const newLog = {
      date: new Date().toLocaleDateString(),
      startTime: new Date(startTime).toLocaleTimeString([], {
        hour: "2-digit",
        minute: "2-digit",
        second: "2-digit",
      }),
      pauseTime: new Date(currentTime).toLocaleTimeString([], {
        hour: "2-digit",
        minute: "2-digit",
        second: "2-digit",
      }),
      duration: formatTime(elapsedTime + pausedDuration),
    };
    const updatedHistory = [...history, newLog];
    setHistory(updatedHistory);
    localStorage.setItem("timerHistory", JSON.stringify(updatedHistory));
  };

  const resumeTimer = () => {
    setRunning(true);
    setPaused(false);
    const resumeStartTime = new Date().getTime();
    setStartTime(resumeStartTime);

    const id = setInterval(() => {
      setElapsedTime((prevElapsed) => prevElapsed + 1000);
    }, 1000);
    setIntervalId(id);

    const updatedHistory = history.map((log, index) =>
      index === history.length - 1
        ? {
            ...log,
            resumeTime: new Date(resumeStartTime).toLocaleTimeString([], {
              hour: "2-digit",
              minute: "2-digit",
              second: "2-digit",
            }),
          }
        : log
    );
    setHistory(updatedHistory);
    localStorage.setItem("timerHistory", JSON.stringify(updatedHistory));
  };

  const resetTimer = () => {
    clearInterval(intervalId);
    setRunning(false);
    setPaused(false);
    setElapsedTime(0);
    setStartTime(null);
  };

  const removeLog = (indexToRemove) => {
    const updatedHistory = history.filter((_, index) => index !== indexToRemove);
    setHistory(updatedHistory);
    localStorage.setItem("timerHistory", JSON.stringify(updatedHistory));
  };

  useEffect(() => {
    const storedHistory = JSON.parse(localStorage.getItem("timerHistory") || "[]");
    setHistory(storedHistory);
  }, []);
const exportToExcel = () => {
    
    const groupedHistory = history.reduce((acc, entry) => {
      const { date, duration } = entry;
      if (!acc[date]) {
        acc[date] = { logs: [], totalDurationMs: 0 };
      }
      acc[date].logs.push(entry);
      acc[date].totalDurationMs += parseDurationToMs(duration); 
      return acc;
    }, {});
  
    
    const excelData = [];
    
    
    excelData.push(["Date", "Total Duration", "Log Number", "Start Time", "Pause Time", "Resume Time", "Duration"]);
  
    
    Object.entries(groupedHistory).forEach(([date, { logs, totalDurationMs }]) => {
      logs.forEach((entry, index) => {
        excelData.push([
          date,  
          formatMsToDuration(totalDurationMs),    
          index + 1,  
          entry.startTime,  
          entry.pauseTime,  
          entry.resumeTime || 'N/A',  
          entry.duration,  
        ]);
      });
    });
  
    
    const worksheet = XLSX.utils.aoa_to_sheet(excelData);  
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Timer History");
  
    
    XLSX.writeFile(workbook, "monthly_timer_history.xlsx");
  };
  
  const clearLog = () => {
    setHistory([]);
    localStorage.removeItem("timerHistory");
  };
  
  const parseDurationToMs = (duration) => {
    const [hours, minutes, seconds] = duration.split(":").map(Number);
    return (hours * 3600 + minutes * 60 + seconds) * 1000;
  };

  
  const formatMsToDuration = (milliseconds) => {
    const totalSeconds = Math.floor(milliseconds / 1000);
    const hours = String(Math.floor(totalSeconds / 3600)).padStart(2, "0");
    const minutes = String(Math.floor((totalSeconds % 3600) / 60)).padStart(
      2,
      "0"
    );
    const seconds = String(totalSeconds % 60).padStart(2, "0");
    return `${hours}:${minutes}:${seconds}`;
  };

  return (
    <div className="container">
       <div>
        <h2>Hello! {name}</h2> 
      </div>
      <div className="button-container">
        <div className="timer-display">{formatTime(elapsedTime)}</div>

        <div className="control-buttons">
          {!running && !paused && (
            <button onClick={startTimer} className="start-stop-button">
              Start
            </button>
          )}
          {running && (
            <button onClick={stopTimer} className="start-stop-button">
              Pause
            </button>
          )}
          {paused && (
            <button onClick={resumeTimer} className="start-stop-button">
              Resume
            </button>
          )}
          <button onClick={resetTimer} className="reset-button">
            Reset
          </button>
        </div>

        <button onClick={exportToExcel} className="export-button">
          Export Timelog
        </button>

        {/* Timer History Section */}
        <div className="history-table">
  {history.length > 0 ? (
    Object.entries(
      history.reduce((acc, entry) => {
        const { date, duration } = entry;
        if (!acc[date]) {
          acc[date] = { logs: [], totalDurationMs: 0 };
        }
        acc[date].logs.push(entry);
        acc[date].totalDurationMs += parseDurationToMs(duration);
        return acc;
      }, {})
    ).map(([date, { logs, totalDurationMs }], dateIndex) => (
      <div key={dateIndex} className="log-group">
        <h4>
          {formatMsToDuration(totalDurationMs)} - {date}
        </h4>
        {logs.map((entry, index) => (
          <div key={index} className="log-entry">
            <p>
              Log {index + 1}: <span>Start: {entry.startTime}</span> |{" "}
              <span>Pause: {entry.pauseTime}</span> |{" "}
              {entry.resumeTime && <span>Resume: {entry.resumeTime}</span>}{" "}
              <span>Duration: {entry.duration}</span>
            <button onClick={() => removeLog(index)} className="remove-log-button">
                Remove
              </button>
            </p>
          </div>
        ))}
      </div>
    ))
  ) : (
    <p>No history yet.</p>
  )}
  {/* <button onClick={clearLog} className="clear-button">
    Clear All Logs
  </button> */}
</div>

      </div>
      <div className="history-data-show">
        <DateHistory history={history} />
      </div>
      <div className="App">
      {isPopupOpen && <Popup onClose={closePopup} />}
    </div>
    </div>
  );
};

export default TimerButtons;
