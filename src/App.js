import React, { Component } from 'react';
import clsx from 'clsx';
import * as XLSX from 'xlsx';
import './App.css';

const pad = (n) => (n < 10 ? `0${n}` : n);

class App extends Component {
  constructor(props) {
    super(props);
    this.state = {
      t: 0, // total time in seconds
      paused: true,
      mode: 'stopwatch',
      fullscreen: false,
      adjusting: false,
      editing: null, // minute, second, null
      showCursor: false,
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
    this.setState((prevState) => ({
      paused: !prevState.paused,
      editing: false,
    }), this.saveTimer);
  };

  toggleEditing = () => {
    const { editing } = this.state;
    this.setState({
      editing: editing ? null : 'second',
    });
  };

  handleCursorMove(direction) {
    this.setState((prevState) => {
      let newTime = prevState.t;
      if (direction === 'up' || direction === 'down') {
        const increment = direction === 'up' ? 1 : -1;
        newTime += increment * (prevState.editing === 'second' ? 1 : prevState.editing === 'minute' ? 60 : 3600); // Adjust for hour increment
        if (newTime < 0) newTime = 0;
      }

      return {
        t: newTime,
        paused: true,
        editing: direction === 'left' ? 'minute' : direction === 'right' ? 'second' : prevState.editing,
      };
    }, this.saveTimer);
  }

  handleKeyDown = (event) => {
    switch (event.key) {
      case 'F':
      case 'f':
        this.toggleFullScreen();
        break;
      case 'R':
      case 'r':
        this.resetTimer();
        break;
      case 'S':
      case 's':
        this.switchMode();
        break;
      case 'ArrowUp':
      case 'ArrowDown':
      case 'ArrowLeft':
      case 'ArrowRight':
        this.handleCursorMove(event.key.toLowerCase().replace('arrow', ''));
        break;
      case 'Enter':
        this.toggleEditing();
        break;
      case ' ':
        this.pauseTimer();
        break;
      default:
        break;
    }
  };

  exportToExcel = () => {
    const currentDate = new Date().toLocaleDateString();
    const hours = Math.floor(this.state.t / 3600);
    const minutes = Math.floor((this.state.t % 3600) / 60);
    const seconds = this.state.t % 60;
    const formattedTime = `${pad(hours)}:${pad(minutes)}:${pad(seconds)}`;
    const modeLabel = this.state.mode === 'stopwatch' ? 'Workhours' : this.state.mode;

    const data = [
      {
        Compony: "Quantumbot",
        Date: currentDate,
        Timer: formattedTime,
        Mode:modeLabel,
        Paused: this.state.paused ? 'Yes' : 'No',
      },
    ];

    const worksheet = XLSX.utils.json_to_sheet(data);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "TimerData");
    
    XLSX.writeFile(workbook, `timer_data_${currentDate}.xlsx`);
  };

  render() {
    const { t, paused, editing, mode, showCursor, fullscreen } = this.state;
    
    // Calculate hours, minutes, and seconds
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
        <ul className="tips">
          {/* <li>
            <button onClick={this.toggleFullScreen}>F</button> - <span className="tip">{fullscreen ? 'exit' : 'enter'} fullscreen</span>
          </li> */}
            <li>
            <button onClick={this.pauseTimer}>Space</button> - <span className="tip">{paused ? 'start' : 'pause'} timer</span>
          </li>
          <li>
            <button onClick={this.switchMode}>S</button> - 
            {mode === 'countdown' ? (
              <span className="tip">
                <span>countdown ✓</span> or <button onClick={() => this.switchMode('stopwatch')}>stopwatch</button>
              </span>
            ) : (
              <span className="tip">
                <button onClick={() => this.switchMode('countdown')}>countdown</button> or <span>stopwatch ✓</span>
              </span>
            )}
          </li>
          <li>
            <button onClick={() => this.handleCursorMove('left')}>←</button>
            <button onClick={() => this.handleCursorMove('right')}>→</button>
            <button onClick={() => this.handleCursorMove('up')}>↑</button>
            <button onClick={() => this.handleCursorMove('down')}>↓</button> - <span className="tip">edit timer</span>
          </li>
          <li>
            <button onClick={this.resetTimer}>R</button> - <span className="tip">reset timer</span>
          </li>
        
        
          <li>
            <button onClick={this.exportToExcel}>Export to Excel</button> - <span className="tip">export timer details to Excel</span>
          </li>
        </ul>
      </div>
    );
  }
}

export default App;
