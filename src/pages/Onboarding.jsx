import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import './Onboarding.css';

const Onboarding = () => {
  const [step, setStep] = useState(1);
  const [formData, setFormData] = useState({
    // Schedule
    wakeUpTime: '04:00',
    busToCollegeStart: '06:45',
    busToCollegeEnd: '07:45',
    prepTimeStart: '05:00',
    prepTimeEnd: '06:45',
    collegeStart: '08:00',
    collegeEnd: '15:40',
    busReturnStart: '15:50',
    busReturnEnd: '17:10',
    refreshTimeStart: '17:10',
    refreshTimeEnd: '18:00',
    activeEveningStart: '18:00',
    activeEveningEnd: '22:00',
    usualSleepTime: '23:00',
    
    // Productive activities
    productiveActivities: [''],
    
    // Unproductive activities
    unproductiveActivities: [''],
    
    // Semester info
    semesters: [{
      semesterNumber: 1,
      startDate: '',
      endDate: '',
      subjects: [{
        code: '',
        name: '',
        facultyInitials: '',
        courseType: 'theory',
        units: [
          { number: 1, name: '' },
          { number: 2, name: '' },
          { number: 3, name: '' },
          { number: 4, name: '' },
          { number: 5, name: '' }
        ]
      }]
    }]
  });
  
  const { updateUserProfile } = useAuth();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);

  const handleInputChange = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleArrayChange = (field, index, value) => {
    setFormData(prev => ({
      ...prev,
      [field]: prev[field].map((item, i) => i === index ? value : item)
    }));
  };

  const addArrayItem = (field) => {
    setFormData(prev => ({
      ...prev,
      [field]: [...prev[field], '']
    }));
  };

  const removeArrayItem = (field, index) => {
    if (formData[field].length > 1) {
      setFormData(prev => ({
        ...prev,
        [field]: prev[field].filter((_, i) => i !== index)
      }));
    }
  };

  const handleSubjectChange = (semIndex, subIndex, field, value) => {
    setFormData(prev => {
      const newSemesters = [...prev.semesters];
      newSemesters[semIndex].subjects[subIndex][field] = value;
      return { ...prev, semesters: newSemesters };
    });
  };

  // Check if a subject code is duplicate within a semester
  const isDuplicateCode = (semIndex, subIndex, code) => {
    if (!code || !code.trim()) return false;
    
    const normalizedCode = code.trim().toUpperCase();
    const semester = formData.semesters[semIndex];
    
    return semester.subjects.some((subject, idx) => 
      idx !== subIndex && 
      subject.code.trim().toUpperCase() === normalizedCode
    );
  };

  const handleUnitChange = (semIndex, subIndex, unitIndex, field, value) => {
    setFormData(prev => {
      const newSemesters = [...prev.semesters];
      newSemesters[semIndex].subjects[subIndex].units[unitIndex][field] = value;
      return { ...prev, semesters: newSemesters };
    });
  };

  const addSubject = (semIndex) => {
    setFormData(prev => {
      const newSemesters = [...prev.semesters];
      newSemesters[semIndex].subjects.push({
        code: '',
        name: '',
        facultyInitials: '',
        courseType: 'theory',
        units: [
          { number: 1, name: '' },
          { number: 2, name: '' },
          { number: 3, name: '' },
          { number: 4, name: '' },
          { number: 5, name: '' }
        ]
      });
      return { ...prev, semesters: newSemesters };
    });
  };

  const removeSubject = (semIndex, subIndex) => {
    setFormData(prev => {
      const newSemesters = [...prev.semesters];
      if (newSemesters[semIndex].subjects.length > 1) {
        newSemesters[semIndex].subjects = newSemesters[semIndex].subjects.filter((_, i) => i !== subIndex);
      }
      return { ...prev, semesters: newSemesters };
    });
  };

  const handleSubmit = async () => {
    // Validate no duplicate subject codes across all semesters
    for (const semester of formData.semesters) {
      const subjectCodes = semester.subjects
        .map(s => s.code.trim().toUpperCase())
        .filter(code => code); // Remove empty codes
      
      const duplicates = subjectCodes.filter((code, index) => 
        subjectCodes.indexOf(code) !== index
      );
      
      if (duplicates.length > 0) {
        alert(`Error in Semester ${semester.semesterNumber}:\nDuplicate subject codes found: ${[...new Set(duplicates)].join(', ')}\n\nEach subject must have a unique code within the semester.`);
        return;
      }

      // Check for empty subject codes
      const emptyCodeSubjects = semester.subjects.filter(s => !s.code.trim());
      if (emptyCodeSubjects.length > 0) {
        alert(`Error in Semester ${semester.semesterNumber}:\nAll subjects must have a subject code.`);
        return;
      }

      // Check for empty subject names
      const emptyNameSubjects = semester.subjects.filter(s => !s.name.trim());
      if (emptyNameSubjects.length > 0) {
        alert(`Error in Semester ${semester.semesterNumber}:\nAll subjects must have a name.`);
        return;
      }
    }

    try {
      setLoading(true);
      
      console.log('Saving onboarding data...');
      
      await updateUserProfile({
        ...formData,
        onboardingComplete: true,
        completedAt: new Date()
      });
      
      console.log('Onboarding saved successfully, redirecting to dashboard...');
      navigate('/');
    } catch (error) {
      console.error('Error saving profile:', error);
      alert('Failed to save profile. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const nextStep = () => setStep(prev => Math.min(prev + 1, 4));
  const prevStep = () => setStep(prev => Math.max(prev - 1, 1));

  return (
    <div className="onboarding-container">
      <div className="onboarding-box fade-in">
        <div className="onboarding-header">
          <h1 className="mono">SETUP YOUR SYSTEM</h1>
          <div className="step-indicator">
            <span className={step >= 1 ? 'active' : ''}>1</span>
            <span className={step >= 2 ? 'active' : ''}>2</span>
            <span className={step >= 3 ? 'active' : ''}>3</span>
            <span className={step >= 4 ? 'active' : ''}>4</span>
          </div>
        </div>

        <div className="divider"></div>

        {step === 1 && (
          <div className="onboarding-step">
            <h2>Daily Schedule</h2>
            <p className="step-description">Configure your daily routine and time blocks</p>
            
            <div className="grid grid-2">
              <div className="form-group">
                <label>Wake Up Time</label>
                <input
                  type="time"
                  value={formData.wakeUpTime}
                  onChange={(e) => handleInputChange('wakeUpTime', e.target.value)}
                />
              </div>
              
              <div className="form-group">
                <label>Usual Sleep Time</label>
                <input
                  type="time"
                  value={formData.usualSleepTime}
                  onChange={(e) => handleInputChange('usualSleepTime', e.target.value)}
                />
              </div>
              
              <div className="form-group">
                <label>Residence Type</label>
                <select
                  value={formData.residenceType || 'day-scholar'}
                  onChange={(e) => handleInputChange('residenceType', e.target.value)}
                >
                  <option value="day-scholar">Day Scholar (Bus)</option>
                  <option value="hosteller">Hosteller</option>
                </select>
              </div>
              
              {formData.residenceType === 'day-scholar' && (
                <>
                  <div className="form-group">
                    <label>Bus to College (Start)</label>
                    <input
                      type="time"
                      value={formData.busToCollegeStart}
                      onChange={(e) => handleInputChange('busToCollegeStart', e.target.value)}
                    />
                  </div>
                  
                  <div className="form-group">
                    <label>Bus to College (End)</label>
                    <input
                      type="time"
                      value={formData.busToCollegeEnd}
                      onChange={(e) => handleInputChange('busToCollegeEnd', e.target.value)}
                    />
                  </div>
                  
                  <div className="form-group">
                    <label>Prep Time (Start) - Not Tracked</label>
                    <input
                      type="time"
                      value={formData.prepTimeStart}
                      onChange={(e) => handleInputChange('prepTimeStart', e.target.value)}
                    />
                  </div>
                  
                  <div className="form-group">
                    <label>Prep Time (End) - Not Tracked</label>
                    <input
                      type="time"
                      value={formData.prepTimeEnd}
                      onChange={(e) => handleInputChange('prepTimeEnd', e.target.value)}
                    />
                  </div>
                  
                  <div className="form-group">
                    <label>Bus Return (Start)</label>
                    <input
                      type="time"
                      value={formData.busReturnStart}
                      onChange={(e) => handleInputChange('busReturnStart', e.target.value)}
                    />
                  </div>
                  
                  <div className="form-group">
                    <label>Bus Return (End)</label>
                    <input
                      type="time"
                      value={formData.busReturnEnd}
                      onChange={(e) => handleInputChange('busReturnEnd', e.target.value)}
                    />
                  </div>
                </>
              )}
              
              <div className="form-group">
                <label>College Hours (Start)</label>
                <input
                  type="time"
                  value={formData.collegeStart}
                  onChange={(e) => handleInputChange('collegeStart', e.target.value)}
                />
              </div>
              
              <div className="form-group">
                <label>College Hours (End)</label>
                <input
                  type="time"
                  value={formData.collegeEnd}
                  onChange={(e) => handleInputChange('collegeEnd', e.target.value)}
                />
              </div>
              
              {formData.residenceType === 'day-scholar' && (
                <>
                  <div className="form-group">
                    <label>Bus Return (Start)</label>
                    <input
                      type="time"
                      value={formData.busReturnStart}
                      onChange={(e) => handleInputChange('busReturnStart', e.target.value)}
                    />
                  </div>
                  
                  <div className="form-group">
                    <label>Bus Return (End)</label>
                    <input
                      type="time"
                      value={formData.busReturnEnd}
                      onChange={(e) => handleInputChange('busReturnEnd', e.target.value)}
                    />
                  </div>
                </>
              )}
              
              <div className="form-group">
                <label>Refresh Time (Start) - Not Tracked</label>
                <input
                  type="time"
                  value={formData.refreshTimeStart}
                  onChange={(e) => handleInputChange('refreshTimeStart', e.target.value)}
                />
              </div>
              
              <div className="form-group">
                <label>Refresh Time (End) - Not Tracked</label>
                <input
                  type="time"
                  value={formData.refreshTimeEnd}
                  onChange={(e) => handleInputChange('refreshTimeEnd', e.target.value)}
                />
              </div>
              
              <div className="form-group">
                <label>Active Evening (Start)</label>
                <input
                  type="time"
                  value={formData.activeEveningStart}
                  onChange={(e) => handleInputChange('activeEveningStart', e.target.value)}
                />
              </div>
              
              <div className="form-group">
                <label>Active Evening (End)</label>
                <input
                  type="time"
                  value={formData.activeEveningEnd}
                  onChange={(e) => handleInputChange('activeEveningEnd', e.target.value)}
                />
              </div>
              
              <div className="form-group" style={{ marginTop: '2rem', borderTop: '1px solid #e5e5e5', paddingTop: '1.5rem' }}>
                <label style={{ display: 'flex', alignItems: 'center', cursor: 'pointer' }}>
                  <input
                    type="checkbox"
                    checked={formData.enableHealthMetrics || false}
                    onChange={(e) => handleInputChange('enableHealthMetrics', e.target.checked)}
                    style={{ width: 'auto', marginRight: '0.75rem', cursor: 'pointer' }}
                  />
                  <span>Enable Health Metrics (Weight, Water Intake, Steps tracking)</span>
                </label>
                <small style={{ display: 'block', marginTop: '0.5rem', color: 'var(--text-secondary)', marginLeft: '1.75rem' }}>
                  You can enable/disable this later in Profile settings
                </small>
              </div>
            </div>
          </div>
        )}

        {step === 2 && (
          <div className="onboarding-step">
            <h2>Activity Categories</h2>
            <p className="step-description">Define what counts as productive and unproductive for you</p>
            
            <div className="form-group">
              <label>Productive Activities</label>
              {formData.productiveActivities.map((activity, index) => (
                <div key={index} className="array-input">
                  <input
                    type="text"
                    value={activity}
                    onChange={(e) => handleArrayChange('productiveActivities', index, e.target.value)}
                    placeholder="e.g., LeetCode, Reading, Assignment"
                  />
                  <button
                    type="button"
                    onClick={() => removeArrayItem('productiveActivities', index)}
                    className="secondary"
                  >
                    Remove
                  </button>
                </div>
              ))}
              <button
                type="button"
                onClick={() => addArrayItem('productiveActivities')}
                className="secondary"
              >
                + Add Productive Activity
              </button>
            </div>
            
            <div className="divider"></div>
            
            <div className="form-group">
              <label>Unproductive Activities</label>
              {formData.unproductiveActivities.map((activity, index) => (
                <div key={index} className="array-input">
                  <input
                    type="text"
                    value={activity}
                    onChange={(e) => handleArrayChange('unproductiveActivities', index, e.target.value)}
                    placeholder="e.g., Social Media, YouTube, Gaming"
                  />
                  <button
                    type="button"
                    onClick={() => removeArrayItem('unproductiveActivities', index)}
                    className="secondary"
                  >
                    Remove
                  </button>
                </div>
              ))}
              <button
                type="button"
                onClick={() => addArrayItem('unproductiveActivities')}
                className="secondary"
              >
                + Add Unproductive Activity
              </button>
            </div>
          </div>
        )}

        {step === 3 && (
          <div className="onboarding-step">
            <h2>Semester Configuration</h2>
            <p className="step-description">Set up your current semester details</p>
            
            {formData.semesters.map((semester, semIndex) => (
              <div key={semIndex} className="semester-config">
                <div className="grid grid-3">
                  <div className="form-group">
                    <label>Semester Number</label>
                    <select
                      value={semester.semesterNumber}
                      onChange={(e) => {
                        const newSemesters = [...formData.semesters];
                        newSemesters[semIndex].semesterNumber = parseInt(e.target.value);
                        setFormData(prev => ({ ...prev, semesters: newSemesters }));
                      }}
                    >
                      {[1,2,3,4,5,6,7,8].map(num => (
                        <option key={num} value={num}>Semester {num}</option>
                      ))}
                    </select>
                  </div>
                  
                  <div className="form-group">
                    <label>Start Date (DD/MM/YYYY)</label>
                    <input
                      type="date"
                      value={semester.startDate}
                      onChange={(e) => {
                        const newSemesters = [...formData.semesters];
                        newSemesters[semIndex].startDate = e.target.value;
                        setFormData(prev => ({ ...prev, semesters: newSemesters }));
                      }}
                      placeholder="DD/MM/YYYY"
                    />
                    {semester.startDate && (
                      <small className="date-hint">
                        Selected: {new Date(semester.startDate + 'T00:00').toLocaleDateString('en-GB')}
                      </small>
                    )}
                  </div>
                  
                  <div className="form-group">
                    <label>End Date (DD/MM/YYYY)</label>
                    <input
                      type="date"
                      value={semester.endDate}
                      onChange={(e) => {
                        const newSemesters = [...formData.semesters];
                        newSemesters[semIndex].endDate = e.target.value;
                        setFormData(prev => ({ ...prev, semesters: newSemesters }));
                      }}
                      placeholder="DD/MM/YYYY"
                    />
                    {semester.endDate && (
                      <small className="date-hint">
                        Selected: {new Date(semester.endDate + 'T00:00').toLocaleDateString('en-GB')}
                      </small>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {step === 4 && (
          <div className="onboarding-step">
            <h2>Subject Details</h2>
            <p className="step-description">Add your subjects and their units</p>
            
            {formData.semesters.map((semester, semIndex) => (
              <div key={semIndex} className="semester-subjects">
                <h3>Semester {semester.semesterNumber} Subjects</h3>
                
                {semester.subjects.map((subject, subIndex) => (
                  <div key={subIndex} className="subject-card card">
                    <div className="grid grid-3">
                      <div className="form-group">
                        <label>Subject Code</label>
                        <input
                          type="text"
                          value={subject.code}
                          onChange={(e) => handleSubjectChange(semIndex, subIndex, 'code', e.target.value)}
                          placeholder="e.g., UIT3311"
                          className={isDuplicateCode(semIndex, subIndex, subject.code) ? 'input-error' : ''}
                        />
                        {isDuplicateCode(semIndex, subIndex, subject.code) && (
                          <small className="error-hint">⚠️ Duplicate code! Each subject must have a unique code.</small>
                        )}
                      </div>
                      
                      <div className="form-group">
                        <label>Subject Name</label>
                        <input
                          type="text"
                          value={subject.name}
                          onChange={(e) => handleSubjectChange(semIndex, subIndex, 'name', e.target.value)}
                          placeholder="e.g., Data Structures"
                        />
                      </div>
                      
                      <div className="form-group">
                        <label>Faculty Initials</label>
                        <input
                          type="text"
                          value={subject.facultyInitials}
                          onChange={(e) => handleSubjectChange(semIndex, subIndex, 'facultyInitials', e.target.value)}
                          placeholder="e.g., JD"
                        />
                      </div>
                    </div>
                    
                    <div className="form-group">
                      <label>Course Type</label>
                      <select
                        value={subject.courseType || 'theory'}
                        onChange={(e) => handleSubjectChange(semIndex, subIndex, 'courseType', e.target.value)}
                      >
                        <option value="theory">Theory (5 units)</option>
                        <option value="tcp">Theory cum Practical (5 units + Lab)</option>
                        <option value="practical">Practical (Lab only)</option>
                      </select>
                    </div>
                    
                    {(subject.courseType === 'theory' || subject.courseType === 'tcp' || !subject.courseType) && (
                      <div className="units-section">
                        <label>Theory Units</label>
                        {subject.units.map((unit, unitIndex) => (
                          <div key={unitIndex} className="form-group">
                            <input
                              type="text"
                              value={unit.name}
                              onChange={(e) => handleUnitChange(semIndex, subIndex, unitIndex, 'name', e.target.value)}
                              placeholder={`Unit ${unit.number} name`}
                            />
                          </div>
                        ))}
                      </div>
                    )}
                    
                    <button
                      type="button"
                      onClick={() => removeSubject(semIndex, subIndex)}
                      className="secondary"
                    >
                      Remove Subject
                    </button>
                  </div>
                ))}
                
                <button
                  type="button"
                  onClick={() => addSubject(semIndex)}
                  className="secondary"
                >
                  + Add Subject
                </button>
              </div>
            ))}
          </div>
        )}

        <div className="divider"></div>

        <div className="onboarding-actions">
          {step > 1 && (
            <button onClick={prevStep} className="secondary">
              Previous
            </button>
          )}
          
          {step < 4 ? (
            <button onClick={nextStep}>
              Next Step
            </button>
          ) : (
            <>
              <button 
                onClick={handleSubmit} 
                disabled={loading || formData.semesters.some((sem, semIdx) => 
                  sem.subjects.some((sub, subIdx) => 
                    isDuplicateCode(semIdx, subIdx, sub.code) || !sub.code.trim() || !sub.name.trim()
                  )
                )}
              >
                {loading ? 'Saving...' : 'Complete Setup'}
              </button>
              {formData.semesters.some((sem, semIdx) => 
                sem.subjects.some((sub, subIdx) => isDuplicateCode(semIdx, subIdx, sub.code))
              ) && (
                <small className="error-hint" style={{ marginTop: '0.5rem', textAlign: 'center' }}>
                  ⚠️ Please fix duplicate subject codes before continuing
                </small>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default Onboarding;
