import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { collection, query, where, getDocs, setDoc, doc, getDoc, orderBy, limit } from 'firebase/firestore';
import { db } from '../firebase';
import { format } from 'date-fns';
import './HealthMetrics.css';

const HealthMetrics = () => {
  const { user } = useAuth();
  const [selectedDate, setSelectedDate] = useState(format(new Date(), 'yyyy-MM-dd'));
  const [metrics, setMetrics] = useState({
    morningWeight: '',
    glassesOfWater: '',
    steps: '',
    caloriesBurnt: ''
  });
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(false);
  const [saveMessage, setSaveMessage] = useState('');

  useEffect(() => {
    loadMetrics();
    loadHistory();
  }, [selectedDate, user]);

  const loadMetrics = async () => {
    if (!user) return;
    
    try {
      const metricsRef = doc(db, 'healthMetrics', `${user.uid}_${selectedDate}`);
      const metricsSnap = await getDoc(metricsRef);
      
      if (metricsSnap.exists()) {
        setMetrics(metricsSnap.data());
      } else {
        setMetrics({
          morningWeight: '',
          glassesOfWater: '',
          steps: '',
          caloriesBurnt: ''
        });
      }
    } catch (error) {
      console.error('Error loading metrics:', error);
    }
  };

  const loadHistory = async () => {
    if (!user) return;
    
    try {
      // Query all health metrics for this user
      const historyQuery = query(
        collection(db, 'healthMetrics'),
        where('userId', '==', user.uid)
      );
      const historySnapshot = await getDocs(historyQuery);
      
      // Sort manually and take last 7
      const historyData = historySnapshot.docs
        .map(doc => ({
          id: doc.id,
          ...doc.data()
        }))
        .filter(entry => entry.date) // Filter out entries without dates
        .sort((a, b) => b.date.toDate() - a.date.toDate()) // Sort by date descending
        .slice(0, 7); // Take last 7
        
      setHistory(historyData);
    } catch (error) {
      console.error('Error loading history:', error);
    }
  };

  const handleInputChange = (field, value) => {
    setMetrics(prev => ({ ...prev, [field]: value }));
  };

  const handleSave = async () => {
    if (!user) return;
    
    try {
      setLoading(true);
      const metricsRef = doc(db, 'healthMetrics', `${user.uid}_${selectedDate}`);
      
      await setDoc(metricsRef, {
        ...metrics,
        userId: user.uid,
        date: new Date(selectedDate),
        updatedAt: new Date()
      });
      
      setSaveMessage('Saved successfully!');
      setTimeout(() => setSaveMessage(''), 3000);
      loadHistory();
    } catch (error) {
      console.error('Error saving metrics:', error);
      setSaveMessage('Error saving metrics');
    } finally {
      setLoading(false);
    }
  };

  const calculateAverages = () => {
    if (history.length === 0) return null;
    
    const sum = history.reduce((acc, entry) => ({
      weight: acc.weight + (parseFloat(entry.morningWeight) || 0),
      water: acc.water + (parseInt(entry.glassesOfWater) || 0),
      steps: acc.steps + (parseInt(entry.steps) || 0),
      calories: acc.calories + (parseInt(entry.caloriesBurnt) || 0)
    }), { weight: 0, water: 0, steps: 0, calories: 0 });
    
    const count = history.length;
    
    return {
      weight: (sum.weight / count).toFixed(1),
      water: Math.round(sum.water / count),
      steps: Math.round(sum.steps / count),
      calories: Math.round(sum.calories / count)
    };
  };

  const averages = calculateAverages();

  return (
    <div className="health-container">
      <div className="container">
        <div className="health-header fade-in">
          <h1 className="mono">HEALTH_METRICS</h1>
          <p>Track your physical health and activity</p>
        </div>

        <div className="divider"></div>

        <div className="health-input-section">
          <div className="date-selector">
            <label>Select Date</label>
            <input
              type="date"
              value={selectedDate}
              onChange={(e) => setSelectedDate(e.target.value)}
            />
          </div>

          <div className="metrics-grid grid grid-2">
            <div className="metric-input card">
              <label>Morning Weight (kg)</label>
              <input
                type="number"
                step="0.1"
                value={metrics.morningWeight}
                onChange={(e) => handleInputChange('morningWeight', e.target.value)}
                placeholder="70.5"
              />
            </div>

            <div className="metric-input card">
              <label>Glasses of Water</label>
              <input
                type="number"
                value={metrics.glassesOfWater}
                onChange={(e) => handleInputChange('glassesOfWater', e.target.value)}
                placeholder="8"
              />
            </div>

            <div className="metric-input card">
              <label>Steps Walked</label>
              <input
                type="number"
                value={metrics.steps}
                onChange={(e) => handleInputChange('steps', e.target.value)}
                placeholder="10000"
              />
            </div>

            <div className="metric-input card">
              <label>Calories Burnt</label>
              <input
                type="number"
                value={metrics.caloriesBurnt}
                onChange={(e) => handleInputChange('caloriesBurnt', e.target.value)}
                placeholder="2500"
              />
            </div>
          </div>

          <div className="health-actions">
            {saveMessage && (
              <span className={saveMessage.includes('Error') ? 'error' : 'success'}>
                {saveMessage}
              </span>
            )}
            <button onClick={handleSave} disabled={loading}>
              {loading ? 'Saving...' : 'Save Metrics'}
            </button>
          </div>
        </div>

        {averages && (
          <>
            <div className="divider"></div>
            <div className="averages-section fade-in">
              <h2>7-Day Averages</h2>
              <div className="averages-grid grid grid-2">
                <div className="average-card card">
                  <div className="average-label mono">Weight</div>
                  <div className="average-value">{averages.weight} kg</div>
                </div>
                <div className="average-card card">
                  <div className="average-label mono">Water</div>
                  <div className="average-value">{averages.water} glasses</div>
                </div>
                <div className="average-card card">
                  <div className="average-label mono">Steps</div>
                  <div className="average-value">{averages.steps.toLocaleString()}</div>
                </div>
                <div className="average-card card">
                  <div className="average-label mono">Calories</div>
                  <div className="average-value">{averages.calories.toLocaleString()}</div>
                </div>
              </div>
            </div>
          </>
        )}

        {history.length > 0 && (
          <>
            <div className="divider"></div>
            <div className="history-section fade-in">
              <h2>Recent History</h2>
              <div className="history-table">
                <div className="history-header">
                  <div className="mono">Date</div>
                  <div className="mono">Weight</div>
                  <div className="mono">Water</div>
                  <div className="mono">Steps</div>
                  <div className="mono">Calories</div>
                </div>
                {history.map((entry) => (
                  <div key={entry.id} className="history-row">
                    <div>{entry.date ? format(entry.date.toDate(), 'MMM d, yyyy') : 'N/A'}</div>
                    <div>{entry.morningWeight ? `${entry.morningWeight} kg` : '-'}</div>
                    <div>{entry.glassesOfWater || '-'}</div>
                    <div>{entry.steps ? entry.steps.toLocaleString() : '-'}</div>
                    <div>{entry.caloriesBurnt ? entry.caloriesBurnt.toLocaleString() : '-'}</div>
                  </div>
                ))}
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default HealthMetrics;
