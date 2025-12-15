import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { collection, query, where, getDocs, setDoc, doc, getDoc } from 'firebase/firestore';
import { db } from '../firebase';
import { format, parseISO } from 'date-fns';
import './DailyTracker.css';

const DailyTracker = () => {
  const { user, userProfile } = useAuth();
  const [selectedDate, setSelectedDate] = useState(format(new Date(), 'yyyy-MM-dd'));
  const [dayType, setDayType] = useState('college'); // 'college' or 'non-college'
  const [hours, setHours] = useState([]);
  const [dailyReflection, setDailyReflection] = useState('');
  const [loading, setLoading] = useState(false);
  const [saveMessage, setSaveMessage] = useState('');

  // Get active semester for the selected date
  const getActiveSemester = () => {
    if (!userProfile?.semesters) return null;
    
    const selectedDateObj = new Date(selectedDate + 'T00:00:00');
    
    for (const semester of userProfile.semesters) {
      if (!semester.startDate || !semester.endDate) continue;
      
      const startDate = new Date(semester.startDate + 'T00:00:00');
      const endDate = new Date(semester.endDate + 'T23:59:59');
      
      if (selectedDateObj >= startDate && selectedDateObj <= endDate) {
        return semester;
      }
    }
    
    return null; // No active semester for this date
  };

  const activeSemester = getActiveSemester();

  // Clear hours when day type changes
  const handleDayTypeChange = (newDayType) => {
    if (newDayType !== dayType) {
      // Ask user if they want to clear existing data
      if (hours.length > 0) {
        const confirmClear = window.confirm(
          'Changing day type will clear current hour entries. Continue?'
        );
        if (!confirmClear) return;
      }
      setDayType(newDayType);
      setHours([]); // Clear hours when switching day type
    }
  };

  useEffect(() => {
    if (userProfile) {
      loadDayData();
    }
  }, [selectedDate, userProfile]);

  const loadDayData = async () => {
    if (!user) return;
    
    try {
      setLoading(true);
      const dateObj = new Date(selectedDate);
      dateObj.setHours(0, 0, 0, 0);
      
      const entryRef = doc(db, 'dailyEntries', `${user.uid}_${selectedDate}`);
      const entrySnap = await getDoc(entryRef);
      
      if (entrySnap.exists()) {
        const data = entrySnap.data();
        setDayType(data.dayType || 'college');
        setHours(data.hours || []);
        setDailyReflection(data.dailyReflection || '');
      } else {
        // Initialize empty day
        setDayType('college');
        setHours([]);
        setDailyReflection('');
      }
    } catch (error) {
      console.error('Error loading day data:', error);
    } finally {
      setLoading(false);
    }
  };

  const generateHourSlots = () => {
    const slots = [];
    
    if (dayType === 'college') {
      // Pre-college hours (wake time to prep start)
      if (userProfile?.wakeUpTime && userProfile?.prepTimeStart) {
        const wakeHour = parseInt(userProfile.wakeUpTime.split(':')[0]);
        const prepStartHour = parseInt(userProfile.prepTimeStart.split(':')[0]);
        
        for (let i = wakeHour; i < prepStartHour; i++) {
          slots.push({
            time: `${String(i).padStart(2, '0')}:00`,
            label: `${i > 12 ? i - 12 : i}:00 ${i >= 12 ? 'PM' : 'AM'}`,
            type: 'pre-college'
          });
        }
      }
      
      // Bus to college (only for day scholars)
      if (userProfile?.residenceType === 'day-scholar') {
        slots.push({
          time: userProfile?.busToCollegeStart || '06:45',
          label: 'Bus to College',
          type: 'bus-to-college'
        });
      }
      
      // College hours (8 periods)
      const periods = [
        { time: '08:00', label: '1st Hour' },
        { time: '08:45', label: '2nd Hour' },
        { time: '09:30', label: 'Break' },
        { time: '09:50', label: '3rd Hour' },
        { time: '10:35', label: '4th Hour' },
        { time: '11:20', label: '5th Hour' },
        { time: '12:05', label: 'Lunch Break' },
        { time: '13:05', label: '6th Hour' },
        { time: '13:50', label: '7th Hour' },
        { time: '14:35', label: '8th Hour' }
      ];
      
      periods.forEach(period => {
        slots.push({
          ...period,
          type: period.label.includes('Break') || period.label.includes('Lunch') ? 'break' : 'college-hour'
        });
      });
      
      // Bus return (only for day scholars)
      if (userProfile?.residenceType === 'day-scholar') {
        slots.push({
          time: userProfile?.busReturnStart || '15:50',
          label: 'Bus Return',
          type: 'bus-return'
        });
      }
      
      // Evening hours (active evening start to end)
      if (userProfile?.activeEveningStart && userProfile?.activeEveningEnd) {
        const eveningStart = parseInt(userProfile.activeEveningStart.split(':')[0]);
        const eveningEnd = parseInt(userProfile.activeEveningEnd.split(':')[0]);
        
        for (let i = eveningStart; i <= eveningEnd; i++) {
          slots.push({
            time: `${String(i).padStart(2, '0')}:00`,
            label: `${i > 12 ? i - 12 : i}:00 PM`,
            type: 'evening'
          });
        }
      }
    } else {
      // Non-college day: track every hour from wake to sleep
      if (userProfile?.wakeUpTime && userProfile?.usualSleepTime) {
        const wakeHour = parseInt(userProfile.wakeUpTime.split(':')[0]);
        const sleepHour = parseInt(userProfile.usualSleepTime.split(':')[0]);
        
        let currentHour = wakeHour;
        while (currentHour <= 23) {
          slots.push({
            time: `${String(currentHour).padStart(2, '0')}:00`,
            label: `${currentHour > 12 ? currentHour - 12 : currentHour}:00 ${currentHour >= 12 ? 'PM' : 'AM'}`,
            type: 'regular'
          });
          
          if (currentHour === sleepHour) break;
          currentHour++;
        }
      }
    }
    
    return slots;
  };

  const getHourData = (time) => {
    return hours.find(h => h.time === time) || null;
  };

  const updateHourData = (time, field, value) => {
    setHours(prevHours => {
      const existing = prevHours.find(h => h.time === time);
      if (existing) {
        return prevHours.map(h => 
          h.time === time ? { ...h, [field]: value } : h
        );
      } else {
        return [...prevHours, { time, [field]: value }];
      }
    });
  };

  const handleSave = async () => {
    if (!user) return;
    
    try {
      setLoading(true);
      const entryRef = doc(db, 'dailyEntries', `${user.uid}_${selectedDate}`);
      
      await setDoc(entryRef, {
        userId: user.uid,
        date: new Date(selectedDate),
        dayType,
        hours,
        dailyReflection,
        updatedAt: new Date()
      });
      
      setSaveMessage('Saved successfully!');
      setTimeout(() => setSaveMessage(''), 3000);
    } catch (error) {
      console.error('Error saving data:', error);
      setSaveMessage('Error saving data');
    } finally {
      setLoading(false);
    }
  };

  const hourSlots = generateHourSlots();

  return (
    <div className="tracker-container">
      <div className="container">
        <div className="tracker-header fade-in">
          <h1 className="mono">DAILY_TRACKER</h1>
          
          <div className="tracker-controls">
            <div className="form-group">
              <label htmlFor="date-select">Select Date</label>
              <input
                id="date-select"
                name="date"
                type="date"
                value={selectedDate}
                onChange={(e) => setSelectedDate(e.target.value)}
              />
            </div>
            
            <div className="form-group">
              <label htmlFor="day-type-select">Day Type</label>
              <select
                id="day-type-select"
                name="dayType"
                value={dayType}
                onChange={(e) => handleDayTypeChange(e.target.value)}
              >
                <option value="college">College Day</option>
                <option value="non-college">Non-College Day</option>
              </select>
            </div>
          </div>
        </div>

        <div className="divider"></div>

        {loading && <div className="spinner"></div>}

        {!loading && (
          <>
            <div className="hours-grid">
              {hourSlots.map((slot) => {
                const hourData = getHourData(slot.time);
                const isCollegeHour = slot.type === 'college-hour';
                
                return (
                  <div key={slot.time} className={`hour-card card ${slot.type}`}>
                    <div className="hour-header">
                      <span className="hour-time mono">{slot.label}</span>
                      {slot.type === 'break' && (
                        <span className="hour-badge">Break</span>
                      )}
                    </div>
                    
                    {slot.type !== 'break' && (
                      <div className="hour-content">
                        {isCollegeHour && (
                          <>
                            {!activeSemester ? (
                              <div className="warning-message" style={{ marginBottom: '1rem' }}>
                                ⚠️ No semester is active for this date. Please configure semester dates in Profile.
                              </div>
                            ) : (
                              <>
                                <div className="form-group">
                                  <label htmlFor={`subject-${slot.time}`} className="required">Subject</label>
                                  <select
                                    id={`subject-${slot.time}`}
                                    name={`subject-${slot.time}`}
                                    value={hourData?.subject || ''}
                                    onChange={(e) => {
                                      updateHourData(slot.time, 'subject', e.target.value);
                                      if (!hourData?.attendance) {
                                        updateHourData(slot.time, 'attendance', 'present');
                                      }
                                    }}
                                    required
                                    className={!hourData?.subject ? 'error' : 'success'}
                                  >
                                    <option value="">Select subject</option>
                                    {activeSemester?.subjects?.map(sub => (
                                      <option key={sub.code} value={sub.code}>
                                        {sub.code} - {sub.name}
                                      </option>
                                    ))}
                                  </select>
                                  {!hourData?.subject && (
                                    <span className="field-error">Please select a subject for this hour</span>
                                  )}
                                  <small className="semester-hint mono">
                                    Sem {activeSemester.semesterNumber} ({new Date(activeSemester.startDate + 'T00:00').toLocaleDateString('en-GB')} - {new Date(activeSemester.endDate + 'T00:00').toLocaleDateString('en-GB')})
                                  </small>
                                </div>
                                
                                {hourData?.subject && activeSemester?.subjects
                                  ?.find(s => s.code === hourData.subject)?.courseType !== 'practical' && (
                                  <div className="form-group">
                                    <label htmlFor={`unit-${slot.time}`}>Unit Covered</label>
                                    <small className="form-helper">Optional - Select if a specific unit was covered</small>
                                    <select
                                      id={`unit-${slot.time}`}
                                      name={`unit-${slot.time}`}
                                      value={hourData?.unit || ''}
                                      onChange={(e) => updateHourData(slot.time, 'unit', e.target.value)}
                                    >
                                      <option value="">Select unit (optional)</option>
                                      {activeSemester?.subjects
                                        ?.find(s => s.code === hourData.subject)
                                        ?.units?.map(unit => (
                                          <option key={unit.number} value={unit.number}>
                                            Unit {unit.number}: {unit.name}
                                          </option>
                                        ))
                                      }
                                    </select>
                                  </div>
                                )}
                                
                                <div className="form-group">
                                  <label htmlFor={`attendance-${slot.time}`} className="required">Attendance</label>
                                  <select
                                    id={`attendance-${slot.time}`}
                                    name={`attendance-${slot.time}`}
                                    value={hourData?.attendance || 'present'}
                                    onChange={(e) => updateHourData(slot.time, 'attendance', e.target.value)}
                                    required
                                    className={!hourData?.attendance ? 'error' : 'success'}
                                  >
                                    <option value="present">Present</option>
                                    <option value="absent">Absent</option>
                                    <option value="onduty">On Duty</option>
                                    <option value="cancelled">Cancelled</option>
                                  </select>
                                </div>
                              </>
                            )}
                          </>
                        )}

                        {!isCollegeHour && (
                          <>
                            <div className="form-group">
                              <label htmlFor={`activity-${slot.time}`}>Activity</label>
                              <small className="form-helper">Optional - Track what you did this hour</small>
                              <select
                                id={`activity-${slot.time}`}
                                name={`activity-${slot.time}`}
                                value={hourData?.activity || ''}
                                onChange={(e) => updateHourData(slot.time, 'activity', e.target.value)}
                              >
                                <option value="">Select activity (optional)</option>
                                <optgroup label="Productive">
                                  {userProfile?.productiveActivities?.map((act, idx) => (
                                    <option key={idx} value={act}>{act}</option>
                                  ))}
                                </optgroup>
                                <optgroup label="Unproductive">
                                  {userProfile?.unproductiveActivities?.map((act, idx) => (
                                    <option key={idx} value={act}>{act}</option>
                                  ))}
                                </optgroup>
                              </select>
                            </div>
                            
                            <div className="form-group">
                              <label htmlFor={`productivity-${slot.time}`}>Productivity</label>
                              <small className="form-helper">Rate your productivity this hour</small>
                              <select
                                id={`productivity-${slot.time}`}
                                name={`productivity-${slot.time}`}
                                value={hourData?.productivityLevel || '1'}
                                onChange={(e) => updateHourData(slot.time, 'productivityLevel', parseInt(e.target.value))}
                              >
                                <option value="1">1x - Basic</option>
                                <option value="2">2x - Good</option>
                                <option value="5">5x - Very Productive</option>
                                <option value="10">10x - Peak Performance</option>
                              </select>
                            </div>
                          </>
                        )}

                        <div className="form-group">
                          <label htmlFor={`notes-${slot.time}`}>Notes</label>
                          <small className="form-helper">
                            {isCollegeHour ? "What was taught? Key concepts covered?" : "What did you do? What did you learn?"}
                          </small>
                          <textarea
                            id={`notes-${slot.time}`}
                            name={`notes-${slot.time}`}
                            value={hourData?.notes || ''}
                            onChange={(e) => updateHourData(slot.time, 'notes', e.target.value)}
                            placeholder={isCollegeHour ? "What was taught? Key concepts covered?" : "What did you do? What did you learn?"}
                            rows={3}
                          />
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>

            <div className="reflection-section card fade-in">
              <h2>Daily Reflection</h2>
              <div className="form-group">
                <textarea
                  id="daily-reflection"
                  name="dailyReflection"
                  value={dailyReflection}
                  onChange={(e) => setDailyReflection(e.target.value)}
                  placeholder="How was your day? What did you accomplish? What could be improved?"
                  rows={5}
                />
              </div>
            </div>

            <div className="tracker-actions">
              {saveMessage && (
                <span className={saveMessage.includes('Error') ? 'error' : 'success'}>
                  {saveMessage}
                </span>
              )}
              <button onClick={handleSave} disabled={loading}>
                {loading ? 'Saving...' : 'Save Day'}
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default DailyTracker;
