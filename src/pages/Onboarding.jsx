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
    residenceType: 'day-scholar',
    enableHealthMetrics: false,
    
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

  // Validation functions
  const canProceedStep1 = () => {
    const required = ['wakeUpTime', 'usualSleepTime', 'collegeStart', 'collegeEnd', 
                     'activeEveningStart', 'activeEveningEnd'];
    return required.every(field => formData[field]);
  };

  const canProceedStep2 = () => {
    return formData.productiveActivities.some(a => a.trim()) &&
           formData.unproductiveActivities.some(a => a.trim());
  };

  const canProceedStep3 = () => {
    return formData.semesters.every(sem => sem.startDate && sem.endDate);
  };

  const canProceedStep4 = () => {
    return formData.semesters.every(sem => 
      sem.subjects.every(sub => sub.code.trim() && sub.name.trim()) &&
      !sem.subjects.some((sub, idx) => isDuplicateCode(0, idx, sub.code))
    );
  };

  const getValidationMessage = () => {
    if (step === 1 && !canProceedStep1()) {
      return "Please fill in all required time fields (marked with *)";
    }
    if (step === 2 && !canProceedStep2()) {
      return "Add at least one activity in each category";
    }
    if (step === 3 && !canProceedStep3()) {
      return "Set semester start and end dates";
    }
    if (step === 4 && !canProceedStep4()) {
      const hasDuplicates = formData.semesters[0].subjects.some((sub, idx) => 
        isDuplicateCode(0, idx, sub.code)
      );
      const hasEmpty = formData.semesters[0].subjects.some(sub => !sub.code.trim() || !sub.name.trim());
      
      if (hasDuplicates) return "Fix duplicate subject codes";
      if (hasEmpty) return "Fill in all subject codes and names";
    }
    return "";
  };

  const canProceed = () => {
    if (step === 1) return canProceedStep1();
    if (step === 2) return canProceedStep2();
    if (step === 3) return canProceedStep3();
    if (step === 4) return canProceedStep4();
    return true;
  };

  const handleSubmit = async () => {
    if (!canProceed()) {
      alert(getValidationMessage());
      return;
    }

    // Validate no duplicate subject codes across all semesters
    for (const semester of formData.semesters) {
      const subjectCodes = semester.subjects
        .map(s => s.code.trim().toUpperCase())
        .filter(code => code);
      
      const duplicates = subjectCodes.filter((code, index) => 
        subjectCodes.indexOf(code) !== index
      );
      
      if (duplicates.length > 0) {
        alert(`Error in Semester ${semester.semesterNumber}:\nDuplicate subject codes found: ${[...new Set(duplicates)].join(', ')}\n\nEach subject must have a unique code within the semester.`);
        return;
      }

      const emptyCodeSubjects = semester.subjects.filter(s => !s.code.trim());
      if (emptyCodeSubjects.length > 0) {
        alert(`Error in Semester ${semester.semesterNumber}:\nAll subjects must have a subject code.`);
        return;
      }

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

  const nextStep = () => {
    if (!canProceed()) {
      alert(getValidationMessage());
      return;
    }
    setStep(prev => Math.min(prev + 1, 4));
  };
  
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
            <p className="step-description">Configure your daily routine and time blocks (fields marked with * are required)</p>
            
            <div className="grid grid-2">
              <div className="form-group">
                <label htmlFor="wake-time" className="required">Wake Up Time</label>
                <input
                  id="wake-time"
                  name="wake-time"
                  type="time"
                  value={formData.wakeUpTime}
                  onChange={(e) => handleInputChange('wakeUpTime', e.target.value)}
                  required
                  className={!formData.wakeUpTime ? 'error' : 'success'}
                />
                {!formData.wakeUpTime && (
                  <span className="field-error">Please select your wake up time</span>
                )}
              </div>
              
              <div className="form-group">
                <label htmlFor="sleep-time" className="required">Usual Sleep Time</label>
                <input
                  id="sleep-time"
                  name="sleep-time"
                  type="time"
                  value={formData.usualSleepTime}
                  onChange={(e) => handleInputChange('usualSleepTime', e.target.value)}
                  required
                  className={!formData.usualSleepTime ? 'error' : 'success'}
                />
                {!formData.usualSleepTime && (
                  <span className="field-error">Please select your usual sleep time</span>
                )}
              </div>
              
              <div className="form-group">
                <label htmlFor="residence-type">Residence Type</label>
                <select
                  id="residence-type"
                  name="residence-type"
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
                    <label htmlFor="bus-college-start">Bus to College (Start)</label>
                    <small className="form-helper">For day scholars only</small>
                    <input
                      id="bus-college-start"
                      name="bus-college-start"
                      type="time"
                      value={formData.busToCollegeStart}
                      onChange={(e) => handleInputChange('busToCollegeStart', e.target.value)}
                    />
                  </div>
                  
                  <div className="form-group">
                    <label htmlFor="bus-college-end">Bus to College (End)</label>
                    <small className="form-helper">For day scholars only</small>
                    <input
                      id="bus-college-end"
                      name="bus-college-end"
                      type="time"
                      value={formData.busToCollegeEnd}
                      onChange={(e) => handleInputChange('busToCollegeEnd', e.target.value)}
                    />
                  </div>
                  
                  <div className="form-group">
                    <label htmlFor="prep-start">Prep Time (Start) - Not Tracked</label>
                    <small className="form-helper">Morning preparation time</small>
                    <input
                      id="prep-start"
                      name="prep-start"
                      type="time"
                      value={formData.prepTimeStart}
                      onChange={(e) => handleInputChange('prepTimeStart', e.target.value)}
                    />
                  </div>
                  
                  <div className="form-group">
                    <label htmlFor="prep-end">Prep Time (End) - Not Tracked</label>
                    <small className="form-helper">Morning preparation time</small>
                    <input
                      id="prep-end"
                      name="prep-end"
                      type="time"
                      value={formData.prepTimeEnd}
                      onChange={(e) => handleInputChange('prepTimeEnd', e.target.value)}
                    />
                  </div>
                  
                  <div className="form-group">
                    <label htmlFor="bus-return-start">Bus Return (Start)</label>
                    <small className="form-helper">For day scholars only</small>
                    <input
                      id="bus-return-start"
                      name="bus-return-start"
                      type="time"
                      value={formData.busReturnStart}
                      onChange={(e) => handleInputChange('busReturnStart', e.target.value)}
                    />
                  </div>
                  
                  <div className="form-group">
                    <label htmlFor="bus-return-end">Bus Return (End)</label>
                    <small className="form-helper">For day scholars only</small>
                    <input
                      id="bus-return-end"
                      name="bus-return-end"
                      type="time"
                      value={formData.busReturnEnd}
                      onChange={(e) => handleInputChange('busReturnEnd', e.target.value)}
                    />
                  </div>
                </>
              )}
              
              <div className="form-group">
                <label htmlFor="college-start" className="required">College Hours (Start)</label>
                <input
                  id="college-start"
                  name="college-start"
                  type="time"
                  value={formData.collegeStart}
                  onChange={(e) => handleInputChange('collegeStart', e.target.value)}
                  required
                  className={!formData.collegeStart ? 'error' : 'success'}
                />
                {!formData.collegeStart && (
                  <span className="field-error">College start time is required</span>
                )}
              </div>
              
              <div className="form-group">
                <label htmlFor="college-end" className="required">College Hours (End)</label>
                <input
                  id="college-end"
                  name="college-end"
                  type="time"
                  value={formData.collegeEnd}
                  onChange={(e) => handleInputChange('collegeEnd', e.target.value)}
                  required
                  className={!formData.collegeEnd ? 'error' : 'success'}
                />
                {!formData.collegeEnd && (
                  <span className="field-error">College end time is required</span>
                )}
              </div>
              
              <div className="form-group">
                <label htmlFor="refresh-start">Refresh Time (Start) - Not Tracked</label>
                <small className="form-helper">Evening break time</small>
                <input
                  id="refresh-start"
                  name="refresh-start"
                  type="time"
                  value={formData.refreshTimeStart}
                  onChange={(e) => handleInputChange('refreshTimeStart', e.target.value)}
                />
              </div>
              
              <div className="form-group">
                <label htmlFor="refresh-end">Refresh Time (End) - Not Tracked</label>
                <small className="form-helper">Evening break time</small>
                <input
                  id="refresh-end"
                  name="refresh-end"
                  type="time"
                  value={formData.refreshTimeEnd}
                  onChange={(e) => handleInputChange('refreshTimeEnd', e.target.value)}
                />
              </div>
              
              <div className="form-group">
                <label htmlFor="evening-start" className="required">Active Evening (Start)</label>
                <input
                  id="evening-start"
                  name="evening-start"
                  type="time"
                  value={formData.activeEveningStart}
                  onChange={(e) => handleInputChange('activeEveningStart', e.target.value)}
                  required
                  className={!formData.activeEveningStart ? 'error' : 'success'}
                />
                {!formData.activeEveningStart && (
                  <span className="field-error">Evening start time is required</span>
                )}
              </div>
              
              <div className="form-group">
                <label htmlFor="evening-end" className="required">Active Evening (End)</label>
                <input
                  id="evening-end"
                  name="evening-end"
                  type="time"
                  value={formData.activeEveningEnd}
                  onChange={(e) => handleInputChange('activeEveningEnd', e.target.value)}
                  required
                  className={!formData.activeEveningEnd ? 'error' : 'success'}
                />
                {!formData.activeEveningEnd && (
                  <span className="field-error">Evening end time is required</span>
                )}
              </div>
              
              <div className="form-group" style={{ gridColumn: '1 / -1', marginTop: '1.5rem', borderTop: '1px solid #e5e5e5', paddingTop: '1.5rem' }}>
                <label style={{ display: 'flex', alignItems: 'center', cursor: 'pointer', textTransform: 'none', fontSize: '0.9375rem', letterSpacing: '0' }}>
                  <input
                    type="checkbox"
                    checked={formData.enableHealthMetrics || false}
                    onChange={(e) => handleInputChange('enableHealthMetrics', e.target.checked)}
                    style={{ width: 'auto', marginRight: '0.75rem', cursor: 'pointer' }}
                  />
                  <span>Enable Health Metrics (Weight, Water Intake, Steps tracking)</span>
                </label>
                <small className="form-helper" style={{ marginLeft: '1.75rem' }}>
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
              <label className="required">Productive Activities</label>
              <small className="form-helper">Add at least one productive activity (e.g., LeetCode, Reading, Study)</small>
              {formData.productiveActivities.map((activity, index) => (
                <div key={index} className="array-input">
                  <input
                    type="text"
                    value={activity}
                    onChange={(e) => handleArrayChange('productiveActivities', index, e.target.value)}
                    placeholder="e.g., LeetCode, Reading, Assignment"
                    className={
                      !activity.trim() && formData.productiveActivities.length === 1 && index === 0 
                        ? 'error' 
                        : activity.trim() 
                          ? 'success' 
                          : ''
                    }
                  />
                  <button
                    type="button"
                    onClick={() => removeArrayItem('productiveActivities', index)}
                    className="secondary"
                    disabled={formData.productiveActivities.length === 1}
                  >
                    Remove
                  </button>
                </div>
              ))}
              {formData.productiveActivities.every(a => !a.trim()) && (
                <span className="field-error">Add at least one productive activity</span>
              )}
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
              <label className="required">Unproductive Activities</label>
              <small className="form-helper">Add at least one unproductive activity (e.g., Social Media, Gaming)</small>
              {formData.unproductiveActivities.map((activity, index) => (
                <div key={index} className="array-input">
                  <input
                    type="text"
                    value={activity}
                    onChange={(e) => handleArrayChange('unproductiveActivities', index, e.target.value)}
                    placeholder="e.g., Social Media, YouTube, Gaming"
                    className={
                      !activity.trim() && formData.unproductiveActivities.length === 1 && index === 0 
                        ? 'error' 
                        : activity.trim() 
                          ? 'success' 
                          : ''
                    }
                  />
                  <button
                    type="button"
                    onClick={() => removeArrayItem('unproductiveActivities', index)}
                    className="secondary"
                    disabled={formData.unproductiveActivities.length === 1}
                  >
                    Remove
                  </button>
                </div>
              ))}
              {formData.unproductiveActivities.every(a => !a.trim()) && (
                <span className="field-error">Add at least one unproductive activity</span>
              )}
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
                    <label htmlFor={`semester-number-${semIndex}`}>Semester Number</label>
                    <select
                      id={`semester-number-${semIndex}`}
                      name={`semester-number-${semIndex}`}
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
                    <label htmlFor={`semester-start-${semIndex}`} className="required">Start Date (DD/MM/YYYY)</label>
                    <input
                      id={`semester-start-${semIndex}`}
                      name={`semester-start-${semIndex}`}
                      type="date"
                      value={semester.startDate}
                      onChange={(e) => {
                        const newSemesters = [...formData.semesters];
                        newSemesters[semIndex].startDate = e.target.value;
                        setFormData(prev => ({ ...prev, semesters: newSemesters }));
                      }}
                      placeholder="DD/MM/YYYY"
                      required
                      className={!semester.startDate ? 'error' : 'success'}
                    />
                    {!semester.startDate && (
                      <span className="field-error">Semester start date is required</span>
                    )}
                    {semester.startDate && (
                      <small className="form-helper">
                        Selected: {new Date(semester.startDate + 'T00:00').toLocaleDateString('en-GB')}
                      </small>
                    )}
                  </div>
                  
                  <div className="form-group">
                    <label htmlFor={`semester-end-${semIndex}`} className="required">End Date (DD/MM/YYYY)</label>
                    <input
                      id={`semester-end-${semIndex}`}
                      name={`semester-end-${semIndex}`}
                      type="date"
                      value={semester.endDate}
                      onChange={(e) => {
                        const newSemesters = [...formData.semesters];
                        newSemesters[semIndex].endDate = e.target.value;
                        setFormData(prev => ({ ...prev, semesters: newSemesters }));
                      }}
                      placeholder="DD/MM/YYYY"
                      required
                      className={!semester.endDate ? 'error' : 'success'}
                    />
                    {!semester.endDate && (
                      <span className="field-error">Semester end date is required</span>
                    )}
                    {semester.endDate && (
                      <small className="form-helper">
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
            <p className="step-description">Add your subjects and their units (fields marked with * are required)</p>
            
            {formData.semesters.map((semester, semIndex) => (
              <div key={semIndex} className="semester-subjects">
                <h3>Semester {semester.semesterNumber} Subjects</h3>
                
                {semester.subjects.map((subject, subIndex) => (
                  <div key={subIndex} className="subject-card card">
                    <div className="grid grid-3">
                      <div className="form-group">
                        <label htmlFor={`subject-code-${semIndex}-${subIndex}`} className="required">Subject Code</label>
                        <input
                          id={`subject-code-${semIndex}-${subIndex}`}
                          name={`subject-code-${semIndex}-${subIndex}`}
                          type="text"
                          value={subject.code}
                          onChange={(e) => handleSubjectChange(semIndex, subIndex, 'code', e.target.value)}
                          placeholder="e.g., UIT3311"
                          required
                          className={
                            !subject.code.trim() ? 'error' :
                            isDuplicateCode(semIndex, subIndex, subject.code) ? 'error' : 
                            'success'
                          }
                        />
                        {!subject.code.trim() && (
                          <span className="field-error">Subject code is required</span>
                        )}
                        {subject.code.trim() && isDuplicateCode(semIndex, subIndex, subject.code) && (
                          <span className="field-error">⚠️ Duplicate code! Each subject must have a unique code.</span>
                        )}
                      </div>
                      
                      <div className="form-group">
                        <label htmlFor={`subject-name-${semIndex}-${subIndex}`} className="required">Subject Name</label>
                        <input
                          id={`subject-name-${semIndex}-${subIndex}`}
                          name={`subject-name-${semIndex}-${subIndex}`}
                          type="text"
                          value={subject.name}
                          onChange={(e) => handleSubjectChange(semIndex, subIndex, 'name', e.target.value)}
                          placeholder="e.g., Data Structures"
                          required
                          className={!subject.name.trim() ? 'error' : 'success'}
                        />
                        {!subject.name.trim() && (
                          <span className="field-error">Subject name is required</span>
                        )}
                      </div>
                      
                      <div className="form-group">
                        <label htmlFor={`faculty-initials-${semIndex}-${subIndex}`}>Faculty Initials</label>
                        <small className="form-helper">Optional</small>
                        <input
                          id={`faculty-initials-${semIndex}-${subIndex}`}
                          name={`faculty-initials-${semIndex}-${subIndex}`}
                          type="text"
                          value={subject.facultyInitials}
                          onChange={(e) => handleSubjectChange(semIndex, subIndex, 'facultyInitials', e.target.value)}
                          placeholder="e.g., JD"
                        />
                      </div>
                    </div>
                    
                    <div className="form-group">
                      <label htmlFor={`course-type-${semIndex}-${subIndex}`}>Course Type</label>
                      <select
                        id={`course-type-${semIndex}-${subIndex}`}
                        name={`course-type-${semIndex}-${subIndex}`}
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
                        <small className="form-helper">Optional - Add unit names for better tracking</small>
                        {subject.units.map((unit, unitIndex) => (
                          <div key={unitIndex} className="form-group">
                            <input
                              id={`unit-${semIndex}-${subIndex}-${unitIndex}`}
                              name={`unit-${semIndex}-${subIndex}-${unitIndex}`}
                              type="text"
                              value={unit.name}
                              onChange={(e) => handleUnitChange(semIndex, subIndex, unitIndex, 'name', e.target.value)}
                              placeholder={`Unit ${unit.number} name (optional)`}
                            />
                          </div>
                        ))}
                      </div>
                    )}
                    
                    <button
                      type="button"
                      onClick={() => removeSubject(semIndex, subIndex)}
                      className="secondary"
                      disabled={semester.subjects.length === 1}
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
            <>
              <button onClick={nextStep} disabled={!canProceed()}>
                Next Step
              </button>
              {!canProceed() && (
                <span className="button-disabled-reason">
                  {getValidationMessage()}
                </span>
              )}
            </>
          ) : (
            <>
              <button 
                onClick={handleSubmit} 
                disabled={loading || !canProceed()}
              >
                {loading ? 'Saving...' : 'Complete Setup'}
              </button>
              {!canProceed() && (
                <span className="button-disabled-reason">
                  {getValidationMessage()}
                </span>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default Onboarding;
