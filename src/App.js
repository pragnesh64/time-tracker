import React, { Component } from 'react';
import clsx from 'clsx';
import * as XLSX from 'xlsx';
import './App.css';

const pad = (n) => (n < 10 ? `0${n}` : n);

class App extends Component {
  constructor(props) {
    super(props);
    this.state = {
      t: 0,
      paused: true,
      mode: 'stopwatch',
      fullscreen: false,
      adjusting: false,
      editing: null,
      showCursor: false,
      logs: [], // Added to store log history
    };
    this.timer = null;
  }

  componentDidMount() {
    const savedTimer = localStorage.getItem('timer');
    if (savedTimer) {
      this.setState(JSON.parse(savedTimer));
    }
    this.timer = setInterval(() => {
      this.tick();
    }, 1000);
    window.addEventListener('keydown', this.handleKeyDown);
  }

  componentWillUnmount() {
    clearInterval(this.timer);
    window.removeEventListener('keydown', this.handleKeyDown);
  }

  tick() {
    const { mode, paused, showCursor, editing } = this.state;
    if (editing) {
      this.setState({ showCursor: !showCursor });
    }
    if (paused) return;

    this.setState((prevState) => {
      const t = prevState.t + (mode === 'countdown' ? -1 : 1);
      if (t <= 0) {
        return {
          t: 0,
          paused: true,
        };
      } else {
        return {
          t,
        };
      }
    }, this.saveTimer);
  }

  saveTimer = () => {
    localStorage.setItem('timer', JSON.stringify(this.state));
  };

  toggleFullScreen = () => {
    const { fullscreen } = this.state;
    if (!fullscreen) {
      document.documentElement.requestFullscreen();
    } else {
      if (document.exitFullscreen) {
        document.exitFullscreen();
      }
    }
    this.setState({ fullscreen: !fullscreen });
  };

  resetTimer = () => {
    this.setState({
      t: 0,
      paused: true,
    }, this.saveTimer);
  };

  switchMode = (mode) => {
    this.setState({
      mode: mode || (this.state.mode === 'stopwatch' ? 'countdown' : 'stopwatch'),
    }, this.saveTimer);
  };

  pauseTimer = () => {
    const { t, paused, mode, logs } = this.state;

    if (paused) {
      // Start logging when the timer is started
      const startTime = new Date();
      this.setState({
        logs: [...logs, { id: logs.length + 1, startTime: startTime.toLocaleTimeString(), stopTime: null }],
      });
    } else {
      // Log the stop time when paused
      const stopTime = new Date().toLocaleTimeString();
      this.setState(prevState => ({
        logs: prevState.logs.map(log => 
          log.stopTime === null ? { ...log, stopTime } : log
        ),
      }));
    }

    this.setState((prevState) => ({
      paused: !prevState.paused,
      editing: false,
    }), this.saveTimer);
  };

  handleKeyDown = (event) => {
    switch (event.key) {
      case "F":
      case "f":
        this.toggleFullScreen();
        break;
      case "R":
      case "r":
        this.resetTimer();
        break;
      case "Enter":
        this.toggleEditing();
        break;
      case " ":
        this.pauseTimer();
        break;
      case "D":
      case "d":
        this.exportToExcel();
        break;
      default:
        break;
    }
  };

  exportToExcel = () => {
    // Get the current date
    const currentDate = new Date().toLocaleDateString(); // Use the current date in MM/DD/YYYY format
  
    // Format time from seconds (this.state.t)
    const hours = Math.floor(this.state.t / 3600);
    const minutes = Math.floor((this.state.t % 3600) / 60);
    const seconds = this.state.t % 60;
  
    // Pad single digits to two digits (e.g., 5 -> 05)
    const pad = (num) => num.toString().padStart(2, '0');
    const formattedTime = `${pad(hours)}:${pad(minutes)}:${pad(seconds)}`;
  
    // Get the mode label (change 'stopwatch' to 'Workhours')
    const modeLabel = this.state.mode === 'stopwatch' ? 'Workhours' : this.state.mode;
  
    // Create the data object for export (for the current timer)
    const data = [
      {
        Company: "Quantumbot", // Fixed company name
        Date: currentDate,      // Current date in the format
        Timer: formattedTime,   // Formatted time
        Mode: modeLabel,        // Mode label (either 'stopwatch' or another mode)
        Paused: this.state.paused ? 'Yes' : 'No', // Paused status
      },
    ];
  
    // Convert the data to a sheet
    const worksheet = XLSX.utils.json_to_sheet(data);
  
    // Create a new workbook
    const workbook = XLSX.utils.book_new();
    
    // Append the sheet to the workbook
    XLSX.utils.book_append_sheet(workbook, worksheet, "TimerData");
  
    // Write the workbook to an Excel file with the current date in the filename
    XLSX.writeFile(workbook, `timer_data_${currentDate}.xlsx`);
  
    // Export all logs to Excel with today's date
    const logData = this.state.logs.map((log) => ({
      Date: currentDate,  // Add today's date to each log entry
      Log: `Log ${log.id}`,
      Start: log.startTime,
      Stop: log.stopTime || "Still running",
      Mode: this.state.mode === 'stopwatch' ? 'Workhours' : this.state.mode,
      Paused: this.state.paused ? 'Yes' : 'No',
    }));
  
    const logWorksheet = XLSX.utils.json_to_sheet(logData);
    const logWorkbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(logWorkbook, logWorksheet, "LogHistory");
    XLSX.writeFile(logWorkbook, `timer_logs_${currentDate}.xlsx`);
  };
  
  deleteLog = (id) => {
    this.setState(prevState => ({
      logs: prevState.logs.filter(log => log.id !== id),
    }));
  };

  render() {
    const { t, paused, editing, mode, showCursor, fullscreen, logs } = this.state;
    
    const hours = parseInt(t / 3600);
    const minutes = parseInt((t % 3600) / 60);
    const seconds = parseInt(t % 60);

    return (
      <div className="App">
        <div
          className={clsx('clock', { 'show-cursor': showCursor })}
          onDoubleClick={this.toggleFullScreen}
        >
          <span className={clsx('time hour', { editing: editing === 'hour' })}>{pad(hours)}</span>:
          <span className={clsx('time minute', { editing: editing === 'minute' })}>{pad(minutes)}</span>:
          <span className={clsx('time second', { editing: editing === 'second' })}>{pad(seconds)}</span>
        </div>

        {/* Display log history */}
        <div className="history">
          <h2>Log History</h2>
          {logs.map(log => (
            <div key={log.id} className="log-entry">
              <div className="log-part">Log {log.id}:</div>
              <div className="log-part">Start at {log.startTime}</div>
              {log.stopTime && <div className="log-part">Stop at {log.stopTime}</div>}
              <button className="delete-button" onClick={() => this.deleteLog(log.id)}>Delete</button>
            </div>
          ))}
        </div>

        <ul className="tips">
          <li>
            <button onClick={this.pauseTimer}>Space</button> - <span className="tip">{paused ? 'start' : 'pause'} timer</span>
          </li>
          <li>
            <button onClick={this.resetTimer}>R</button> - <span className="tip">reset timer</span>
          </li>
          <li>
            <button onClick={this.exportToExcel}>D</button> - <span className="tip">Download Excel</span>
          </li>
        </ul>
      </div>
    );
  }
}

export default App;
