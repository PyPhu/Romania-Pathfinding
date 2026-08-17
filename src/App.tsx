import { useState } from 'react';
import type { CSSProperties } from 'react';
import './App.css'; // คุณสามารถปรับแต่ง CSS เพิ่มเติมในไฟล์นี้ได้

function App() {
  const [showResults, setShowResults] = useState(false);

  const handleFindPath = () => {
    setShowResults(true);
  };

  return (
    <div style={styles.container}>
      {/* Header */}
      <h2 style={styles.header}>Romania Pathfinding</h2>
      <hr style={styles.divider} />

      {/* Controls Section */}
      <div style={styles.controlsRow}>
        <div style={styles.controlItem}>
          <label style={styles.label}>Start</label>
          <div style={styles.box}>Arad</div>
        </div>
        <div style={styles.controlItem}>
          <label style={styles.label}>Goal</label>
          <div style={styles.box}>Iasi</div>
        </div>
        <div style={styles.controlItem}>
          <label style={styles.label}>Algorithm</label>
          <div style={styles.box}>Hierarchical A*</div>
        </div>
      </div>

      <div style={styles.buttonContainer}>
        <button style={styles.button} onClick={handleFindPath}>
          [ Find Path ]
        </button>
      </div>

      <hr style={styles.divider} />

      {/* Map Section */}
      <div style={styles.mapSection}>
        <h3 style={styles.mapTitle}>ROMANIA MAP</h3>
        <pre style={styles.asciiMap}>
{`       ●────●                       
      /      \\                      
     ●        ●────●                
               \\      \\             
                ●─────●────●        
                      ╲             
                       ●────●       `}
        </pre>
        <p style={styles.highlightText}>Highlighted Path</p>
      </div>

      <hr style={styles.divider} />

      {/* Results Section */}
      <div style={styles.resultsSection}>
        <h3 style={styles.resultsTitle}>Results</h3>
        {showResults ? (
          <div style={styles.resultsData}>
            <p><strong>Group Path:</strong> A → B → C → D</p>
            <br />
            <p><strong>Total Cost:</strong> 709 km</p>
            <p><strong>Nodes Explored:</strong> 15</p>
            <p><strong>Runtime:</strong> 0.41 ms</p>
          </div>
        ) : (
          <p style={{ color: '#888' }}>Please click "[ Find Path ]" to see results...</p>
        )}
      </div>
    </div>
  );
}

// ชุดคำสั่งตกแต่งสไตล์เพื่อให้โครงสร้างคล้ายกับหน้าจอในตัวอย่าง
const styles: { [key: string]: CSSProperties } = {
  container: {
    maxWidth: '600px',
    margin: '40px auto',
    padding: '20px',
    border: '2px solid #333',
    borderRadius: '8px',
    fontFamily: 'monospace, sans-serif',
    backgroundColor: '#1e1e1e',
    color: '#d4d4d4',
  },
  header: {
    textAlign: 'center',
    margin: '10px 0',
    letterSpacing: '2px',
  },
  divider: {
    borderColor: '#333',
    margin: '20px 0',
  },
  controlsRow: {
    display: 'flex',
    justifyContent: 'space-between',
    marginBottom: '20px',
    padding: '0 20px',
  },
  controlItem: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
  },
  label: {
    marginBottom: '8px',
    fontSize: '16px',
  },
  box: {
    border: '1px solid #d4d4d4',
    padding: '8px 16px',
    borderRadius: '4px',
    backgroundColor: '#2d2d2d',
  },
  buttonContainer: {
    textAlign: 'center',
    margin: '20px 0',
  },
  button: {
    backgroundColor: '#333',
    color: '#fff',
    border: '1px solid #d4d4d4',
    padding: '10px 20px',
    fontSize: '16px',
    cursor: 'pointer',
    fontFamily: 'monospace',
    borderRadius: '4px',
  },
  mapSection: {
    textAlign: 'center',
    margin: '30px 0',
  },
  mapTitle: {
    marginBottom: '15px',
    letterSpacing: '1px',
  },
  asciiMap: {
    display: 'inline-block',
    textAlign: 'left',
    backgroundColor: '#111',
    padding: '20px',
    borderRadius: '8px',
    lineHeight: '1.2',
    color: '#4fc1ff',
  },
  highlightText: {
    marginTop: '15px',
    color: '#ce9178',
  },
  resultsSection: {
    padding: '0 20px',
  },
  resultsTitle: {
    marginBottom: '15px',
  },
  resultsData: {
    lineHeight: '1.6', // ถ้า Error เรื่อง lineHeight ให้เปลี่ยนเป็น '1.6' แทน 1.6
    fontSize: '15px',
  }
};

export default App;