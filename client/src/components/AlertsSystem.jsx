import React, { useState, useEffect } from 'react';
import { Bell, Plus, Trash2, Edit, CheckCircle, AlertCircle } from 'lucide-react';

const AlertsSystem = ({ selectedMarket, currentPrice }) => {
  const [alerts, setAlerts] = useState([]);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [newAlert, setNewAlert] = useState({
    type: 'PRICE_ABOVE',
    value: '',
    enabled: true
  });

  useEffect(() => {
    // Load saved alerts from localStorage
    const savedAlerts = JSON.parse(localStorage.getItem('hyperdash-alerts') || '[]');
    setAlerts(savedAlerts);
  }, []);

  useEffect(() => {
    // Check for triggered alerts
    checkAlerts();
  }, [currentPrice, alerts]);

  const checkAlerts = () => {
    if (!currentPrice || !selectedMarket) return;

    const updatedAlerts = alerts.map(alert => {
      if (alert.triggered || !alert.enabled || alert.symbol !== selectedMarket) {
        return alert;
      }

      let shouldTrigger = false;
      let triggerReason = '';

      switch (alert.type) {
        case 'PRICE_ABOVE':
          if (currentPrice >= alert.value) {
            shouldTrigger = true;
            triggerReason = `Price reached $${alert.value}`;
          }
          break;
        case 'PRICE_BELOW':
          if (currentPrice <= alert.value) {
            shouldTrigger = true;
            triggerReason = `Price dropped to $${alert.value}`;
          }
          break;
        case 'VOLUME_SPIKE':
          // Mock volume spike detection
          if (Math.random() > 0.95) {
            shouldTrigger = true;
            triggerReason = 'Volume spike detected';
          }
          break;
        case 'INDICATOR_SIGNAL':
          // Mock indicator signal
          if (Math.random() > 0.98) {
            shouldTrigger = true;
            triggerReason = 'Technical indicator signal';
          }
          break;
      }

      if (shouldTrigger) {
        // Show browser notification
        if (Notification.permission === 'granted') {
          new Notification(`HyperDash Alert: ${selectedMarket}`, {
            body: triggerReason,
            icon: '/favicon.ico',
            tag: alert.id
          });
        }

        return {
          ...alert,
          triggered: true,
          triggeredAt: Date.now(),
          triggerReason
        };
      }

      return alert;
    });

    const hasChanges = updatedAlerts.some((alert, index) => 
      alert.triggered !== alerts[index].triggered
    );

    if (hasChanges) {
      setAlerts(updatedAlerts);
      localStorage.setItem('hyperdash-alerts', JSON.stringify(updatedAlerts));
    }
  };

  const requestNotificationPermission = async () => {
    if (Notification.permission === 'default') {
      await Notification.requestPermission();
    }
  };

  const createAlert = () => {
    if (!newAlert.value || !selectedMarket) return;

    const alert = {
      id: Date.now().toString(),
      symbol: selectedMarket,
      type: newAlert.type,
      value: parseFloat(newAlert.value),
      enabled: newAlert.enabled,
      triggered: false,
      createdAt: Date.now(),
      triggerReason: ''
    };

    const updatedAlerts = [...alerts, alert];
    setAlerts(updatedAlerts);
    localStorage.setItem('hyperdash-alerts', JSON.stringify(updatedAlerts));
    
    setNewAlert({ type: 'PRICE_ABOVE', value: '', enabled: true });
    setShowCreateForm(false);
  };

  const deleteAlert = (alertId) => {
    const updatedAlerts = alerts.filter(alert => alert.id !== alertId);
    setAlerts(updatedAlerts);
    localStorage.setItem('hyperdash-alerts', JSON.stringify(updatedAlerts));
  };

  const toggleAlert = (alertId) => {
    const updatedAlerts = alerts.map(alert => 
      alert.id === alertId ? { ...alert, enabled: !alert.enabled } : alert
    );
    setAlerts(updatedAlerts);
    localStorage.setItem('hyperdash-alerts', JSON.stringify(updatedAlerts));
  };

  const clearTriggered = () => {
    const updatedAlerts = alerts.map(alert => 
      alert.triggered ? { ...alert, triggered: false, triggerReason: '' } : alert
    );
    setAlerts(updatedAlerts);
    localStorage.setItem('hyperdash-alerts', JSON.stringify(updatedAlerts));
  };

  const getAlertTypeLabel = (type) => {
    switch (type) {
      case 'PRICE_ABOVE': return 'Price Above';
      case 'PRICE_BELOW': return 'Price Below';
      case 'VOLUME_SPIKE': return 'Volume Spike';
      case 'INDICATOR_SIGNAL': return 'Indicator Signal';
      default: return type;
    }
  };

  const getAlertTypeIcon = (type) => {
    switch (type) {
      case 'PRICE_ABOVE': return '↗️';
      case 'PRICE_BELOW': return '↘️';
      case 'VOLUME_SPIKE': return '📈';
      case 'INDICATOR_SIGNAL': return '⚡';
      default: return '🔔';
    }
  };

  return (
    <div className="alerts-system">
      <div className="alerts-header">
        <h3>Price Alerts</h3>
        <div className="alerts-controls">
          <button 
            className="btn-primary"
            onClick={() => {
              requestNotificationPermission();
              setShowCreateForm(true);
            }}
          >
            <Plus size={16} />
            New Alert
          </button>
          {alerts.some(a => a.triggered) && (
            <button className="btn-secondary" onClick={clearTriggered}>
              Clear Triggered
            </button>
          )}
        </div>
      </div>

      {showCreateForm && (
        <div className="create-alert-form">
          <h4>Create New Alert</h4>
          <div className="form-group">
            <label>Alert Type</label>
            <select 
              value={newAlert.type} 
              onChange={(e) => setNewAlert({...newAlert, type: e.target.value})}
            >
              <option value="PRICE_ABOVE">Price Above</option>
              <option value="PRICE_BELOW">Price Below</option>
              <option value="VOLUME_SPIKE">Volume Spike</option>
              <option value="INDICATOR_SIGNAL">Indicator Signal</option>
            </select>
          </div>
          <div className="form-group">
            <label>Value</label>
            <input 
              type="number" 
              value={newAlert.value}
              onChange={(e) => setNewAlert({...newAlert, value: e.target.value})}
              placeholder="Enter price value"
              step="0.01"
            />
          </div>
          <div className="form-group">
            <label>
              <input 
                type="checkbox" 
                checked={newAlert.enabled}
                onChange={(e) => setNewAlert({...newAlert, enabled: e.target.checked})}
              />
              Enable Alert
            </label>
          </div>
          <div className="form-actions">
            <button className="btn-primary" onClick={createAlert}>
              Create Alert
            </button>
            <button className="btn-secondary" onClick={() => setShowCreateForm(false)}>
              Cancel
            </button>
          </div>
        </div>
      )}

      <div className="alerts-list">
        {alerts.length === 0 ? (
          <div className="no-alerts">
            <Bell size={48} />
            <p>No alerts set up yet</p>
            <p>Create your first alert to get notified of price movements</p>
          </div>
        ) : (
          alerts.map(alert => (
            <div key={alert.id} className={`alert-item ${alert.triggered ? 'triggered' : ''}`}>
              <div className="alert-info">
                <div className="alert-header">
                  <span className="alert-icon">{getAlertTypeIcon(alert.type)}</span>
                  <span className="alert-symbol">{alert.symbol}</span>
                  <span className="alert-type">{getAlertTypeLabel(alert.type)}</span>
                  {alert.triggered && (
                    <span className="triggered-badge">
                      <CheckCircle size={16} />
                      Triggered
                    </span>
                  )}
                </div>
                <div className="alert-details">
                  <span className="alert-value">${alert.value}</span>
                  {alert.triggered && alert.triggerReason && (
                    <span className="trigger-reason">{alert.triggerReason}</span>
                  )}
                  <span className="alert-time">
                    Created {new Date(alert.createdAt).toLocaleDateString()}
                  </span>
                </div>
              </div>
              <div className="alert-actions">
                <button 
                  className={`toggle-btn ${alert.enabled ? 'enabled' : 'disabled'}`}
                  onClick={() => toggleAlert(alert.id)}
                >
                  {alert.enabled ? 'Enabled' : 'Disabled'}
                </button>
                <button 
                  className="delete-btn"
                  onClick={() => deleteAlert(alert.id)}
                >
                  <Trash2 size={16} />
                </button>
              </div>
            </div>
          ))
        )}
      </div>

      <div className="alerts-stats">
        <div className="stat">
          <span className="stat-label">Total Alerts</span>
          <span className="stat-value">{alerts.length}</span>
        </div>
        <div className="stat">
          <span className="stat-label">Active</span>
          <span className="stat-value">{alerts.filter(a => a.enabled && !a.triggered).length}</span>
        </div>
        <div className="stat">
          <span className="stat-label">Triggered</span>
          <span className="stat-value">{alerts.filter(a => a.triggered).length}</span>
        </div>
      </div>
    </div>
  );
};

export default AlertsSystem;
