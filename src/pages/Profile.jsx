import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import './Profile.css';

const Profile = () => {
  const { user, userProfile, updateUserProfile } = useAuth();
  const [activeTab, setActiveTab] = useState('schedule');
  const [formData, setFormData] = useState({});
  const [loading, setLoading] = useState(false);
  const [saveMessage, setSaveMessage] = useState('');

  useEffect(() => {
    if (userProfile) {
      setFormData(userProfile);
    }
  }, [userProfile]);

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
      [field]: [...(prev[field] || []), '']
    }));
  };

  const removeArrayItem = (field, index) => {
    if (formData[field]?.length > 1) {
      setFormData(prev => ({
        ...prev,
        [field]: prev[field].filter((_, i) => i !== index)
      }));
    }
  };

  const handleSave = async () => {
    // Validate no duplicate subject codes in each semester
    if (!formData.semesters || !Array.isArray(formData.semesters)) {
      setSaveMessage('Error: No semester data found');
      setTimeout(() => setSaveMessage(''), 3000);
      return;
    }

    for (const semester of formData.semesters) {
      if (!semester.subjects || !Array.isArray(semester.subjects)) {
        continue; // Skip if no subjects
      }

      const subjectCodes = semester.subjects
        .map(s => s.code?.trim().toUpperCase() || '')
        .filter(code => code); // Remove empty codes
      
      const duplicates = subjectCodes.filter((code, index) => 
        subjectCodes.indexOf(code) !== index
      );
      
      if (duplicates.length > 0) {
        setSaveMessage(`Error in Semester ${semester.semesterNumber}: Duplicate subject codes: ${[...new Set(duplicates)].join(', ')}`);
        setTimeout(() => setSaveMessage(''), 5000);
        return;
      }

      // Check for empty subject codes
      const emptyCodeSubjects = semester.subjects.filter(s => !s.code || !s.code.trim());
      if (emptyCodeSubjects.length > 0) {
        setSaveMessage(`Error in Semester ${semester.semesterNumber}: All subjects must have a code`);
        setTimeout(() => setSaveMessage(''), 5000);
        return;
      }

      // Check for empty subject names
      const emptyNameSubjects = semester.subjects.filter(s => !s.name || !s.name.trim());
      if (emptyNameSubjects.length > 0) {
        setSaveMessage(`Error in Semester ${semester.semesterNumber}: All subjects must have a name`);
        setTimeout(() => setSaveMessage(''), 5000);
        return;
      }
    }

    try {
      setLoading(true);
      await updateUserProfile(formData);
      setSaveMessage('Profile updated successfully!');
      setTimeout(() => setSaveMessage(''), 3000);
    } catch (error) {
      console.error('Error updating profile:', error);
      setSaveMessage('Error updating profile');
    } finally {
      setLoading(false);
    }
  };

  // Check if a subject code is duplicate within a semester
  const isDuplicateCode = (semIndex, subIndex, code) => {
    if (!code || !code.trim()) return false;
    if (!formData.semesters || !formData.semesters[semIndex]) return false;
    if (!formData.semesters[semIndex].subjects) return false;
    
    const normalizedCode = code.trim().toUpperCase();
    const semester = formData.semesters[semIndex];
    
    return semester.subjects.some((subject, idx) => 
      idx !== subIndex && 
      subject.code && 
      subject.code.trim().toUpperCase() === normalizedCode
    );
  };

  return (
    <div className="profile-container">
      <div className="container">
        <div className="profile-header fade-in">
          <div>
            <h1 className="mono">PROFILE_SETTINGS</h1>
            <p>Manage your Personal OS configuration</p>
          </div>
          <div className="profile-user">
            <img src={user?.photoURL} alt={user?.displayName} />
            <div>
              <div className="profile-name">{user?.displayName}</div>
              <div className="profile-email">{user?.email}</div>
            </div>
          </div>
        </div>

        <div className="divider"></div>

        <div className="profile-tabs">
          <button
            className={activeTab === 'schedule' ? 'active' : 'secondary'}
            onClick={() => setActiveTab('schedule')}
          >
            Schedule
          </button>
          <button
            className={activeTab === 'activities' ? 'active' : 'secondary'}
            onClick={() => setActiveTab('activities')}
          >
            Activities
          </button>
          <button
            className={activeTab === 'semesters' ? 'active' : 'secondary'}
            onClick={() => setActiveTab('semesters')}
          >
            Semesters
          </button>
        </div>

        <div className="profile-content">
          {activeTab === 'schedule' && (
            <div className="settings-section fade-in">
              <h2>Daily Schedule</h2>
              
              <div className="form-group" style={{ marginBottom: '2rem' }}>
                <label>Residence Type</label>
                <select
                  value={formData.residenceType || 'day-scholar'}
                  onChange={(e) => handleInputChange('residenceType', e.target.value)}
                >
                  <option value="day-scholar">Day Scholar (Bus)</option>
                  <option value="hosteller">Hosteller</option>
                </select>
              </div>
              
              <div className="grid grid-2">
                {formData.residenceType === 'day-scholar' && (
                  <>
                    <div className="form-group">
                      <label>Bus to College (Start)</label>
                      <input
                        type="time"
                        value={formData.busToCollegeStart || ''}
                        onChange={(e) => handleInputChange('busToCollegeStart', e.target.value)}
                      />
                    </div>
                    
                    <div className="form-group">
                      <label>Bus to College (End)</label>
                      <input
                        type="time"
                        value={formData.busToCollegeEnd || ''}
                        onChange={(e) => handleInputChange('busToCollegeEnd', e.target.value)}
                      />
                    </div>
                    
                    <div className="form-group">
                      <label>Prep Time (Start)</label>
                      <input
                        type="time"
                        value={formData.prepTimeStart || ''}
                        onChange={(e) => handleInputChange('prepTimeStart', e.target.value)}
                      />
                    </div>
                    
                    <div className="form-group">
                      <label>Prep Time (End)</label>
                      <input
                        type="time"
                        value={formData.prepTimeEnd || ''}
                        onChange={(e) => handleInputChange('prepTimeEnd', e.target.value)}
                      />
                    </div>
                    
                    <div className="form-group">
                      <label>Bus Return (Start)</label>
                      <input
                        type="time"
                        value={formData.busReturnStart || ''}
                        onChange={(e) => handleInputChange('busReturnStart', e.target.value)}
                      />
                    </div>
                    
                    <div className="form-group">
                      <label>Bus Return (End)</label>
                      <input
                        type="time"
                        value={formData.busReturnEnd || ''}
                        onChange={(e) => handleInputChange('busReturnEnd', e.target.value)}
                      />
                    </div>
                  </>
                )}
                
                <div className="form-group">
                  <label>Active Evening (Start)</label>
                  <input
                    type="time"
                    value={formData.activeEveningStart || ''}
                    onChange={(e) => handleInputChange('activeEveningStart', e.target.value)}
                  />
                </div>
                
                <div className="form-group">
                  <label>Active Evening (End)</label>
                  <input
                    type="time"
                    value={formData.activeEveningEnd || ''}
                    onChange={(e) => handleInputChange('activeEveningEnd', e.target.value)}
                  />
                </div>
                
                <div className="form-group">
                  <label>Usual Sleep Time</label>
                  <input
                    type="time"
                    value={formData.usualSleepTime || ''}
                    onChange={(e) => handleInputChange('usualSleepTime', e.target.value)}
                  />
                </div>
              </div>
              
              <div className="form-group" style={{ marginTop: '2rem', borderTop: '1px solid #e5e5e5', paddingTop: '1.5rem' }}>
                <label style={{ display: 'flex', alignItems: 'center', cursor: 'pointer' }}>
                  <input
                    type="checkbox"
                    checked={formData.enableHealthMetrics || false}
                    onChange={(e) => handleInputChange('enableHealthMetrics', e.target.checked)}
                    style={{ width: 'auto', marginRight: '0.75rem', cursor: 'pointer' }}
                  />
                  <span>Enable Health Metrics</span>
                </label>
                <small style={{ display: 'block', marginTop: '0.5rem', color: 'var(--text-secondary)', marginLeft: '1.75rem' }}>
                  Shows/hides Health tab in navigation. Track weight, water intake, and steps.
                </small>
              </div>
            </div>
          )}

          {activeTab === 'activities' && (
            <div className="settings-section fade-in">
              <h2>Activity Categories</h2>
              
              <div className="activity-section">
                <h3>Productive Activities</h3>
                {formData.productiveActivities?.map((activity, index) => (
                  <div key={index} className="array-input">
                    <input
                      type="text"
                      value={activity}
                      onChange={(e) => handleArrayChange('productiveActivities', index, e.target.value)}
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
                  + Add Activity
                </button>
              </div>

              <div className="divider"></div>

              <div className="activity-section">
                <h3>Unproductive Activities</h3>
                {formData.unproductiveActivities?.map((activity, index) => (
                  <div key={index} className="array-input">
                    <input
                      type="text"
                      value={activity}
                      onChange={(e) => handleArrayChange('unproductiveActivities', index, e.target.value)}
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
                  + Add Activity
                </button>
              </div>
            </div>
          )}

          {activeTab === 'semesters' && (
            <div className="settings-section fade-in">
              <h2>Semester Information</h2>
              
              {formData.semesters?.map((semester, semIndex) => (
                <div key={semIndex} className="semester-info card">
                  <div className="semester-header-row">
                    <h3>Semester {semester.semesterNumber}</h3>
                    <button
                      type="button"
                      onClick={() => {
                        setFormData(prev => ({
                          ...prev,
                          semesters: prev.semesters.filter((_, i) => i !== semIndex)
                        }));
                      }}
                      className="secondary"
                      style={{ padding: '0.5rem 1rem' }}
                    >
                      Delete Semester
                    </button>
                  </div>
                  
                  <div className="grid grid-3" style={{ marginBottom: '1.5rem' }}>
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
                      <label>Start Date</label>
                      <input
                        type="date"
                        value={semester.startDate}
                        onChange={(e) => {
                          const newSemesters = [...formData.semesters];
                          newSemesters[semIndex].startDate = e.target.value;
                          setFormData(prev => ({ ...prev, semesters: newSemesters }));
                        }}
                      />
                    </div>
                    
                    <div className="form-group">
                      <label>End Date</label>
                      <input
                        type="date"
                        value={semester.endDate}
                        onChange={(e) => {
                          const newSemesters = [...formData.semesters];
                          newSemesters[semIndex].endDate = e.target.value;
                          setFormData(prev => ({ ...prev, semesters: newSemesters }));
                        }}
                      />
                    </div>
                  </div>
                  
                  <div className="subjects-list">
                    <h4>Subjects</h4>
                    {semester.subjects?.map((subject, subIndex) => (
                      <div key={subIndex} className="subject-edit-card">
                        <div className="grid grid-3">
                          <div className="form-group">
                            <label htmlFor={`subject-code-edit-${subIndex}`} className="required">Subject Code</label>
                            <input
                              id={`subject-code-edit-${subIndex}`}
                              name={`subject-code-edit-${subIndex}`}
                              type="text"
                              value={subject.code}
                              onChange={(e) => {
                                const newSemesters = [...formData.semesters];
                                newSemesters[semIndex].subjects[subIndex].code = e.target.value;
                                setFormData(prev => ({ ...prev, semesters: newSemesters }));
                              }}
                              className={
                                !subject.code.trim() ? 'error' :
                                isDuplicateCode(semIndex, subIndex, subject.code) ? 'error' : 
                                'success'
                              }
                              placeholder="e.g., UIT3311"
                              required
                            />
                            {!subject.code.trim() && (
                              <span className="field-error">Subject code is required</span>
                            )}
                            {subject.code.trim() && isDuplicateCode(semIndex, subIndex, subject.code) && (
                              <span className="field-error">⚠️ Duplicate code in this semester!</span>
                            )}
                          </div>
                          
                          <div className="form-group">
                            <label htmlFor={`subject-name-edit-${subIndex}`} className="required">Subject Name</label>
                            <input
                              id={`subject-name-edit-${subIndex}`}
                              name={`subject-name-edit-${subIndex}`}
                              type="text"
                              value={subject.name}
                              onChange={(e) => {
                                const newSemesters = [...formData.semesters];
                                newSemesters[semIndex].subjects[subIndex].name = e.target.value;
                                setFormData(prev => ({ ...prev, semesters: newSemesters }));
                              }}
                              className={!subject.name.trim() ? 'error' : 'success'}
                              required
                            />
                            {!subject.name.trim() && (
                              <span className="field-error">Subject name is required</span>
                            )}
                          </div>
                          
                          <div className="form-group">
                            <label>Faculty</label>
                            <input
                              type="text"
                              value={subject.facultyInitials}
                              onChange={(e) => {
                                const newSemesters = [...formData.semesters];
                                newSemesters[semIndex].subjects[subIndex].facultyInitials = e.target.value;
                                setFormData(prev => ({ ...prev, semesters: newSemesters }));
                              }}
                            />
                          </div>
                        </div>
                        
                        <div className="form-group">
                          <label>Course Type</label>
                          <select
                            value={subject.courseType || 'theory'}
                            onChange={(e) => {
                              const newSemesters = [...formData.semesters];
                              newSemesters[semIndex].subjects[subIndex].courseType = e.target.value;
                              setFormData(prev => ({ ...prev, semesters: newSemesters }));
                            }}
                          >
                            <option value="theory">Theory</option>
                            <option value="tcp">Theory cum Practical</option>
                            <option value="practical">Practical</option>
                          </select>
                        </div>
                        
                        {(subject.courseType === 'theory' || subject.courseType === 'tcp' || !subject.courseType) && subject.units && (
                          <div className="units-edit">
                            <label>Units</label>
                            {subject.units.map((unit, unitIndex) => (
                              <div key={unitIndex} className="form-group">
                                <input
                                  type="text"
                                  value={unit.name || ''}
                                  onChange={(e) => {
                                    const newSemesters = [...formData.semesters];
                                    newSemesters[semIndex].subjects[subIndex].units[unitIndex].name = e.target.value;
                                    setFormData(prev => ({ ...prev, semesters: newSemesters }));
                                  }}
                                  placeholder={`Unit ${unit.number}`}
                                />
                              </div>
                            ))}
                          </div>
                        )}
                        
                        <button 
                          onClick={handleSave} 
                          disabled={loading || hasValidationErrors()}
                        >
                          {loading ? 'Saving...' : 'Save Changes'}
                        </button>
                        {hasValidationErrors() && (
                          <span className="button-disabled-reason">
                            {getValidationErrorMessage()}
                          </span>
                        )}
                      </div>
                    ))}
                    
                    <button
                      type="button"
                      onClick={() => {
                        const newSemesters = [...formData.semesters];
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
                        setFormData(prev => ({ ...prev, semesters: newSemesters }));
                      }}
                      className="secondary"
                    >
                      + Add Subject
                    </button>
                  </div>
                </div>
              ))}
              
              <button
                type="button"
                onClick={() => {
                  setFormData(prev => ({
                    ...prev,
                    semesters: [...prev.semesters, {
                      semesterNumber: (prev.semesters.length || 0) + 1,
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
                  }));
                }}
                className="secondary"
                style={{ marginTop: '1rem' }}
              >
                + Add Semester
              </button>
            </div>
          )}
        </div>

        <div className="profile-actions">
          {saveMessage && (
            <span className={saveMessage.includes('Error') ? 'error' : 'success'}>
              {saveMessage}
            </span>
          )}
          <button 
            onClick={handleSave} 
            disabled={loading || (formData.semesters && formData.semesters.some((sem, semIdx) => 
              sem.subjects.some((sub, subIdx) => 
                isDuplicateCode(semIdx, subIdx, sub.code) || !sub.code.trim() || !sub.name.trim()
              )
            ))}
          >
            {loading ? 'Saving...' : 'Save Changes'}
          </button>
          {formData.semesters && formData.semesters.some((sem, semIdx) => 
            sem.subjects.some((sub, subIdx) => isDuplicateCode(semIdx, subIdx, sub.code))
          ) && (
            <small className="error-hint" style={{ marginTop: '0.5rem' }}>
              ⚠️ Fix duplicate subject codes to save
            </small>
          )}
        </div>
      </div>
    </div>
  );
};

export default Profile;
