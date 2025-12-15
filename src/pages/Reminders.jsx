import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { collection, query, where, getDocs, addDoc, updateDoc, deleteDoc, doc, orderBy } from 'firebase/firestore';
import { db } from '../firebase';
import { format, isPast, isToday, isFuture } from 'date-fns';
import './Reminders.css';

const Reminders = () => {
  const { user } = useAuth();
  const [reminders, setReminders] = useState([]);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    duration: '',
    deadline: '',
    reminderPeriod: '1',
    completed: false
  });
  const [loading, setLoading] = useState(false);
  const [filter, setFilter] = useState('all'); // 'all', 'active', 'completed'

  useEffect(() => {
    loadReminders();
  }, [user]);

  const loadReminders = async () => {
    if (!user) return;
    
    try {
      setLoading(true);
      const remindersQuery = query(
        collection(db, 'reminders'),
        where('userId', '==', user.uid),
        orderBy('deadline', 'asc')
      );
      const remindersSnapshot = await getDocs(remindersQuery);
      const remindersData = remindersSnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      setReminders(remindersData);
    } catch (error) {
      console.error('Error loading reminders:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const resetForm = () => {
    setFormData({
      name: '',
      description: '',
      duration: '',
      deadline: '',
      reminderPeriod: '1',
      completed: false
    });
    setEditingId(null);
    setShowForm(false);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!user) return;
    
    try {
      setLoading(true);
      
      if (editingId) {
        // Update existing reminder
        const reminderRef = doc(db, 'reminders', editingId);
        await updateDoc(reminderRef, {
          ...formData,
          deadline: new Date(formData.deadline),
          updatedAt: new Date()
        });
      } else {
        // Create new reminder
        await addDoc(collection(db, 'reminders'), {
          ...formData,
          userId: user.uid,
          deadline: new Date(formData.deadline),
          createdAt: new Date(),
          completed: false
        });
      }
      
      resetForm();
      loadReminders();
    } catch (error) {
      console.error('Error saving reminder:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = (reminder) => {
    setFormData({
      name: reminder.name,
      description: reminder.description,
      duration: reminder.duration,
      deadline: format(reminder.deadline.toDate(), 'yyyy-MM-dd'),
      reminderPeriod: reminder.reminderPeriod,
      completed: reminder.completed
    });
    setEditingId(reminder.id);
    setShowForm(true);
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to delete this reminder?')) return;
    
    try {
      await deleteDoc(doc(db, 'reminders', id));
      loadReminders();
    } catch (error) {
      console.error('Error deleting reminder:', error);
    }
  };

  const handleToggleComplete = async (reminder) => {
    try {
      const reminderRef = doc(db, 'reminders', reminder.id);
      await updateDoc(reminderRef, {
        completed: !reminder.completed,
        completedAt: !reminder.completed ? new Date() : null
      });
      loadReminders();
    } catch (error) {
      console.error('Error updating reminder:', error);
    }
  };

  const getDeadlineStatus = (deadline) => {
    const deadlineDate = deadline.toDate();
    if (isPast(deadlineDate) && !isToday(deadlineDate)) return 'overdue';
    if (isToday(deadlineDate)) return 'today';
    return 'upcoming';
  };

  const filteredReminders = reminders.filter(reminder => {
    if (filter === 'active') return !reminder.completed;
    if (filter === 'completed') return reminder.completed;
    return true;
  });

  const activeCount = reminders.filter(r => !r.completed).length;
  const completedCount = reminders.filter(r => r.completed).length;

  return (
    <div className="reminders-container">
      <div className="container">
        <div className="reminders-header fade-in">
          <div>
            <h1 className="mono">REMINDERS & TASKS</h1>
            <p>Manage your deadlines and assignments</p>
          </div>
          <button onClick={() => setShowForm(true)}>
            + New Reminder
          </button>
        </div>

        <div className="divider"></div>

        <div className="filters-section">
          <button
            className={filter === 'all' ? '' : 'secondary'}
            onClick={() => setFilter('all')}
          >
            All ({reminders.length})
          </button>
          <button
            className={filter === 'active' ? '' : 'secondary'}
            onClick={() => setFilter('active')}
          >
            Active ({activeCount})
          </button>
          <button
            className={filter === 'completed' ? '' : 'secondary'}
            onClick={() => setFilter('completed')}
          >
            Completed ({completedCount})
          </button>
        </div>

        {showForm && (
          <div className="reminder-form-overlay">
            <div className="reminder-form card">
              <div className="form-header">
                <h2>{editingId ? 'Edit Reminder' : 'New Reminder'}</h2>
                <button onClick={resetForm} className="secondary">
                  Cancel
                </button>
              </div>
              
              <form onSubmit={handleSubmit}>
                <div className="form-group">
                  <label htmlFor="reminder-name" className="required">Name</label>
                  <input
                    id="reminder-name"
                    name="reminder-name"
                    type="text"
                    value={formData.name}
                    onChange={(e) => handleInputChange('name', e.target.value)}
                    required
                    placeholder="Assignment submission, Project deadline, etc."
                    className={!formData.name.trim() ? 'error' : 'success'}
                  />
                  {!formData.name.trim() && (
                    <span className="field-error">Reminder name is required</span>
                  )}
                </div>

                <div className="form-group">
                  <label htmlFor="reminder-description">Description</label>
                  <small className="form-helper">Optional - Add more details about this reminder</small>
                  <textarea
                    id="reminder-description"
                    name="reminder-description"
                    value={formData.description}
                    onChange={(e) => handleInputChange('description', e.target.value)}
                    placeholder="Additional details..."
                    rows={3}
                  />
                </div>

                <div className="grid grid-2">
                  <div className="form-group">
                    <label htmlFor="reminder-duration">Duration (hours)</label>
                    <small className="form-helper">Optional - Estimated time needed</small>
                    <input
                      id="reminder-duration"
                      name="reminder-duration"
                      type="number"
                      value={formData.duration}
                      onChange={(e) => handleInputChange('duration', e.target.value)}
                      placeholder="Estimated time"
                      min="0"
                      step="0.5"
                    />
                  </div>

                  <div className="form-group">
                    <label htmlFor="reminder-deadline" className="required">Deadline</label>
                    <input
                      id="reminder-deadline"
                      name="reminder-deadline"
                      type="date"
                      value={formData.deadline}
                      onChange={(e) => handleInputChange('deadline', e.target.value)}
                      required
                      min={format(new Date(), 'yyyy-MM-dd')}
                      className={!formData.deadline ? 'error' : 'success'}
                    />
                    {!formData.deadline && (
                      <span className="field-error">Deadline date is required</span>
                    )}
                    {formData.deadline && (
                      <small className="form-helper">
                        Due: {new Date(formData.deadline).toLocaleDateString('en-GB')}
                      </small>
                    )}
                  </div>
                </div>

                <div className="form-group">
                  <label htmlFor="reminder-period">Reminder Period (days before)</label>
                  <small className="form-helper">When should we remind you?</small>
                  <select
                    id="reminder-period"
                    name="reminder-period"
                    value={formData.reminderPeriod}
                    onChange={(e) => handleInputChange('reminderPeriod', e.target.value)}
                  >
                    <option value="0">On the day</option>
                    <option value="1">1 day before</option>
                    <option value="2">2 days before</option>
                    <option value="3">3 days before</option>
                    <option value="7">1 week before</option>
                  </select>
                </div>

                <div className="form-actions">
                  <button 
                    type="submit" 
                    disabled={loading || !formData.name.trim() || !formData.deadline}
                  >
                    {loading ? 'Saving...' : editingId ? 'Update Reminder' : 'Create Reminder'}
                  </button>
                  {(!formData.name.trim() || !formData.deadline) && (
                    <span className="button-disabled-reason">
                      Please provide a name and deadline
                    </span>
                  )}
                </div>
              </form>
            </div>
          </div>
        )}

        {loading && !showForm && <div className="spinner"></div>}

        {!loading && filteredReminders.length === 0 && (
          <div className="empty-state card">
            <p>No reminders found. Create your first reminder to get started!</p>
          </div>
        )}

        <div className="reminders-list">
          {filteredReminders.map((reminder) => {
            const status = getDeadlineStatus(reminder.deadline);
            
            return (
              <div key={reminder.id} className={`reminder-card card ${status} ${reminder.completed ? 'completed' : ''}`}>
                <div className="reminder-checkbox">
                  <input
                    type="checkbox"
                    checked={reminder.completed}
                    onChange={() => handleToggleComplete(reminder)}
                  />
                </div>
                
                <div className="reminder-content">
                  <div className="reminder-title">
                    <h3>{reminder.name}</h3>
                    {status === 'overdue' && !reminder.completed && (
                      <span className="status-badge overdue mono">Overdue</span>
                    )}
                    {status === 'today' && !reminder.completed && (
                      <span className="status-badge today mono">Today</span>
                    )}
                  </div>
                  
                  {reminder.description && (
                    <p className="reminder-description">{reminder.description}</p>
                  )}
                  
                  <div className="reminder-meta">
                    <span className="mono">
                      Deadline: {format(reminder.deadline.toDate(), 'MMM d, yyyy')}
                    </span>
                    {reminder.duration && (
                      <span className="mono">
                        Duration: {reminder.duration}h
                      </span>
                    )}
                  </div>
                </div>
                
                <div className="reminder-actions">
                  <button onClick={() => handleEdit(reminder)} className="secondary">
                    Edit
                  </button>
                  <button onClick={() => handleDelete(reminder.id)} className="secondary">
                    Delete
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};

export default Reminders;
