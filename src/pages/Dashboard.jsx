import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { collection, query, where, getDocs, orderBy, limit } from 'firebase/firestore';
import { db } from '../firebase';
import { format, startOfWeek, endOfWeek, startOfMonth, endOfMonth } from 'date-fns';
import './Dashboard.css';

const Dashboard = () => {
  const { user, userProfile } = useAuth();
  const [stats, setStats] = useState({
    todayProductivity: 0,
    weekProductivity: 0,
    monthProductivity: 0,
    todayHoursLogged: 0,
    weekHoursLogged: 0,
    recentActivities: []
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadStats();
  }, [user]);

  const loadStats = async () => {
    if (!user) return;
    
    try {
      setLoading(true);
      const now = new Date();
      
      // Create date objects for queries
      const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 0, 0, 0);
      const todayEnd = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59);
      
      const weekStart = startOfWeek(now, { weekStartsOn: 1 }); // Monday
      const weekEnd = endOfWeek(now, { weekStartsOn: 1 });
      
      const monthStart = startOfMonth(now);
      const monthEnd = endOfMonth(now);

      // Query all entries for this user
      const allEntriesQuery = query(
        collection(db, 'dailyEntries'),
        where('userId', '==', user.uid)
      );
      const allSnapshot = await getDocs(allEntriesQuery);
      const allData = allSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      
      // Filter by date ranges manually (since Firestore Timestamp comparison can be tricky)
      const todayData = allData.filter(entry => {
        if (!entry.date) return false;
        const entryDate = entry.date.toDate();
        return entryDate >= todayStart && entryDate <= todayEnd;
      });
      
      const weekData = allData.filter(entry => {
        if (!entry.date) return false;
        const entryDate = entry.date.toDate();
        return entryDate >= weekStart && entryDate <= weekEnd;
      });
      
      const monthData = allData.filter(entry => {
        if (!entry.date) return false;
        const entryDate = entry.date.toDate();
        return entryDate >= monthStart && entryDate <= monthEnd;
      });
      
      // Get recent activities (last 5)
      const recentData = allData
        .sort((a, b) => {
          if (!a.date || !b.date) return 0;
          return b.date.toDate() - a.date.toDate();
        })
        .slice(0, 5);

      const calculateProductivity = (entries) => {
        let totalHours = 0;
        let productiveScore = 0;
        
        entries.forEach(entry => {
          if (entry.hours) {
            entry.hours.forEach(hour => {
              totalHours++;
              if (hour.productivityLevel) {
                productiveScore += hour.productivityLevel;
              }
            });
          }
        });
        
        return totalHours > 0 ? Math.round((productiveScore / (totalHours * 10)) * 100) : 0;
      };

      const countHours = (entries) => {
        return entries.reduce((acc, entry) => {
          return acc + (entry.hours ? entry.hours.length : 0);
        }, 0);
      };

      setStats({
        todayProductivity: calculateProductivity(todayData),
        weekProductivity: calculateProductivity(weekData),
        monthProductivity: calculateProductivity(monthData),
        todayHoursLogged: countHours(todayData),
        weekHoursLogged: countHours(weekData),
        recentActivities: recentData
      });
      
    } catch (error) {
      console.error('Error loading stats:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="container">
        <div className="spinner"></div>
      </div>
    );
  }

  return (
    <div className="dashboard-container">
      <div className="container">
        <div className="dashboard-header fade-in">
          <h1>Welcome back, <span className="mono">{user?.displayName?.split(' ')[0]}</span></h1>
          <p className="dashboard-date">{format(new Date(), 'EEEE, MMMM d, yyyy')}</p>
        </div>

        <div className="divider"></div>

        <div className="stats-grid grid grid-3">
          <div className="stat-card card fade-in">
            <div className="stat-label mono">Today</div>
            <div className="stat-value">{stats.todayProductivity}%</div>
            <div className="stat-sublabel">Productivity Index</div>
            <div className="stat-detail">{stats.todayHoursLogged} hours logged</div>
          </div>

          <div className="stat-card card fade-in">
            <div className="stat-label mono">This Week</div>
            <div className="stat-value">{stats.weekProductivity}%</div>
            <div className="stat-sublabel">Productivity Index</div>
            <div className="stat-detail">{stats.weekHoursLogged} hours logged</div>
          </div>

          <div className="stat-card card fade-in">
            <div className="stat-label mono">This Month</div>
            <div className="stat-value">{stats.monthProductivity}%</div>
            <div className="stat-sublabel">Productivity Index</div>
          </div>
        </div>

        <div className="recent-section fade-in">
          <h2>Recent Activity</h2>
          {stats.recentActivities.length === 0 ? (
            <div className="empty-state card">
              <p>No activity logged yet. Start tracking your day!</p>
            </div>
          ) : (
            <div className="activities-list">
              {stats.recentActivities.map((activity) => (
                <div key={activity.id} className="activity-item card">
                  <div className="activity-date mono">
                    {activity.date ? format(activity.date.toDate(), 'MMM d, yyyy') : 'N/A'}
                  </div>
                  <div className="activity-details">
                    <div className="activity-hours">
                      {activity.hours?.length || 0} hours logged
                    </div>
                    {activity.dailyReflection && (
                      <div className="activity-reflection">
                        {activity.dailyReflection.substring(0, 100)}
                        {activity.dailyReflection.length > 100 && '...'}
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="quick-actions fade-in">
          <h2>Quick Actions</h2>
          <div className="grid grid-2">
            <a href="/tracker" className="action-card card">
              <h3 className="mono">Track Today</h3>
              <p>Log your daily activities and productivity</p>
            </a>
            <a href="/health" className="action-card card">
              <h3 className="mono">Health Metrics</h3>
              <p>Record your physical activity and health data</p>
            </a>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
