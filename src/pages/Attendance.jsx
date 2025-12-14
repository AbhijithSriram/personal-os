import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { collection, query, where, getDocs } from 'firebase/firestore';
import { db } from '../firebase';
import { format } from 'date-fns';
import './Attendance.css';

const Attendance = () => {
  const { user, userProfile } = useAuth();
  const [attendanceData, setAttendanceData] = useState([]);
  const [loading, setLoading] = useState(false);
  const [selectedSemester, setSelectedSemester] = useState('current');
  const [selectedSubject, setSelectedSubject] = useState('all');

  useEffect(() => {
    if (userProfile) {
      loadAttendance();
    }
  }, [user, userProfile, selectedSemester]);

  const loadAttendance = async () => {
    if (!user || !userProfile?.semesters) return;
    
    try {
      setLoading(true);
      
      // Get semester to analyze
      let targetSemester;
      if (selectedSemester === 'current') {
        // Find current semester based on today's date
        const today = new Date();
        targetSemester = userProfile.semesters.find(sem => {
          if (!sem.startDate || !sem.endDate) return false;
          const start = new Date(sem.startDate + 'T00:00:00');
          const end = new Date(sem.endDate + 'T23:59:59');
          return today >= start && today <= end;
        });
        
        // If no current semester, use the first one
        if (!targetSemester) {
          targetSemester = userProfile.semesters[0];
        }
      } else {
        // Find specific semester by number
        targetSemester = userProfile.semesters.find(
          sem => sem.semesterNumber === parseInt(selectedSemester)
        );
      }
      
      if (!targetSemester) {
        setAttendanceData([]);
        return;
      }
      
      // Get semester date range
      const semesterStart = new Date(targetSemester.startDate + 'T00:00:00');
      const semesterEnd = new Date(targetSemester.endDate + 'T23:59:59');
      
      // Query all daily entries
      const entriesQuery = query(
        collection(db, 'dailyEntries'),
        where('userId', '==', user.uid)
      );
      const entriesSnapshot = await getDocs(entriesQuery);
      
      // Process attendance data
      const subjectAttendance = {};
      
      targetSemester.subjects.forEach(subject => {
        subjectAttendance[subject.code] = {
          name: subject.name,
          code: subject.code,
          faculty: subject.facultyInitials,
          courseType: subject.courseType,
          present: 0,
          absent: 0,
          onduty: 0,
          cancelled: 0,
          total: 0,
          percentage: 0,
          classes: []
        };
      });
      
      // Process each entry - only within semester date range
      entriesSnapshot.docs.forEach(doc => {
        const entry = doc.data();
        
        // Check if entry date is within semester range
        if (entry.date) {
          const entryDate = entry.date.toDate();
          if (entryDate < semesterStart || entryDate > semesterEnd) {
            return; // Skip entries outside semester range
          }
        }
        
        if (entry.hours && entry.dayType === 'college') {
          entry.hours.forEach(hour => {
            if (hour.subject) {
              // Clean subject code (trim whitespace)
              const subCode = hour.subject.trim();
              
              if (subjectAttendance[subCode]) {
                subjectAttendance[subCode].total++;
                
                // Handle missing attendance field (default to present)
                const attendance = hour.attendance || 'present';
                subjectAttendance[subCode][attendance]++;
                
                subjectAttendance[subCode].classes.push({
                  date: entry.date,
                  time: hour.time,
                  attendance: attendance,
                  unit: hour.unit,
                  notes: hour.notes
                });
              }
            }
          });
        }
      });
      
      // Calculate percentages
      Object.keys(subjectAttendance).forEach(code => {
        const data = subjectAttendance[code];
        const attended = data.present + data.onduty;
        if (data.total > 0) {
          data.percentage = Math.round((attended / data.total) * 100);
        }
        
        // Sort classes by date
        data.classes.sort((a, b) => {
          if (!a.date || !b.date) return 0;
          return b.date.toDate() - a.date.toDate();
        });
      });
      
      setAttendanceData(Object.values(subjectAttendance));
      
    } catch (error) {
      console.error('Error loading attendance:', error);
    } finally {
      setLoading(false);
    }
  };

  const getAttendanceColor = (percentage) => {
    if (percentage >= 75) return '#2e7d32';
    if (percentage >= 65) return '#f57c00';
    return '#d32f2f';
  };

  const filteredData = selectedSubject === 'all' 
    ? attendanceData 
    : attendanceData.filter(sub => sub.code === selectedSubject);

  if (loading) {
    return (
      <div className="container">
        <div className="spinner"></div>
      </div>
    );
  }

  return (
    <div className="attendance-container">
      <div className="container">
        <div className="attendance-header fade-in">
          <h1 className="mono">ATTENDANCE_TRACKER</h1>
          <p>Monitor your class attendance and maintain 75%+</p>
        </div>

        <div className="divider"></div>

        <div className="attendance-filters">
          <div className="form-group">
            <label htmlFor="semester-filter">Filter by Semester</label>
            <select
              id="semester-filter"
              value={selectedSemester}
              onChange={(e) => {
                setSelectedSemester(e.target.value);
                setSelectedSubject('all');
              }}
            >
              <option value="current">Current Semester</option>
              {userProfile?.semesters?.map(sem => (
                <option key={sem.semesterNumber} value={sem.semesterNumber}>
                  Semester {sem.semesterNumber} ({new Date(sem.startDate + 'T00:00').toLocaleDateString('en-GB')} - {new Date(sem.endDate + 'T00:00').toLocaleDateString('en-GB')})
                </option>
              ))}
            </select>
          </div>

          <div className="form-group">
            <label htmlFor="subject-filter">Filter by Subject</label>
            <select
              id="subject-filter"
              value={selectedSubject}
              onChange={(e) => setSelectedSubject(e.target.value)}
            >
              <option value="all">All Subjects</option>
              {attendanceData.map(sub => (
                <option key={sub.code} value={sub.code}>
                  {sub.code} - {sub.name}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div className="attendance-overview grid grid-3">
          {filteredData.map((subject) => (
            <div key={subject.code} className="attendance-card card fade-in">
              <div className="attendance-card-header">
                <h3 className="mono">{subject.code}</h3>
                <span className="course-type-badge">{subject.courseType?.toUpperCase() || 'THEORY'}</span>
              </div>
              
              <h4>{subject.name}</h4>
              <p className="faculty-name mono">{subject.faculty}</p>
              
              <div className="attendance-percentage">
                <div 
                  className="percentage-circle"
                  style={{ borderColor: getAttendanceColor(subject.percentage) }}
                >
                  <span style={{ color: getAttendanceColor(subject.percentage) }}>
                    {subject.percentage}%
                  </span>
                </div>
              </div>
              
              <div className="attendance-breakdown">
                <div className="breakdown-row">
                  <span>Present</span>
                  <span className="mono">{subject.present}</span>
                </div>
                <div className="breakdown-row">
                  <span>Absent</span>
                  <span className="mono">{subject.absent}</span>
                </div>
                <div className="breakdown-row">
                  <span>On Duty</span>
                  <span className="mono">{subject.onduty}</span>
                </div>
                <div className="breakdown-row">
                  <span>Cancelled</span>
                  <span className="mono">{subject.cancelled}</span>
                </div>
                <div className="breakdown-row total">
                  <span>Total Classes</span>
                  <span className="mono">{subject.total}</span>
                </div>
              </div>
              
              {subject.percentage < 75 && (
                <div className="warning-message">
                  ⚠️ Below 75% - Attend next {Math.ceil((0.75 * subject.total - (subject.present + subject.onduty)) / 0.25)} classes
                </div>
              )}
            </div>
          ))}
        </div>

        {selectedSubject !== 'all' && filteredData.length > 0 && (
          <>
            <div className="divider"></div>
            <div className="class-history fade-in">
              <h2>Class History - {filteredData[0].code}</h2>
              <div className="history-table">
                <div className="history-header">
                  <div>Date</div>
                  <div>Time</div>
                  <div>Unit</div>
                  <div>Status</div>
                  <div>Notes</div>
                </div>
                {filteredData[0].classes.map((cls, idx) => (
                  <div key={idx} className="history-row">
                    <div>{cls.date ? format(cls.date.toDate(), 'dd/MM/yyyy') : 'N/A'}</div>
                    <div className="mono">{cls.time}</div>
                    <div>{cls.unit ? `Unit ${cls.unit}` : '-'}</div>
                    <div>
                      <span className={`status-badge ${cls.attendance}`}>
                        {cls.attendance}
                      </span>
                    </div>
                    <div className="notes-cell">{cls.notes || '-'}</div>
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

export default Attendance;
