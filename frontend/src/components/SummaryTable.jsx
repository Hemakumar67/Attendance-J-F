import React, { useState, useEffect } from 'react';
import { api } from '../services/api';

export const SummaryTable = ({ userContext }) => {
  const [month, setMonth] = useState('2026-08');
  const [onlyGaps, setOnlyGaps] = useState(false);
  const [summaries, setSummaries] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [actionSuccess, setActionSuccess] = useState(null);
  
  const [expandedEmpId, setExpandedEmpId] = useState(null);
  const [selectedDate, setSelectedDate] = useState('');
  const [selectedStatus, setSelectedStatus] = useState('P');
  const [recording, setRecording] = useState(false);

  const fetchSummaries = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await api.getSummary(month, onlyGaps);
      setSummaries(data);
    } catch (err) {
      setError(err.message || 'Failed to fetch summary');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSummaries();
  }, [month, onlyGaps]);

  const canWriteForEmp = (empId) => {
    const permissions = userContext.permissions;
    if (permissions.includes('attendance:write:company')) return true;
    if (permissions.includes('attendance:write:reports')) {
      return true;
    }
    return false;
  };

  const handleRecordAttendance = async (empId, date) => {
    if (!date) return;
    setRecording(true);
    setError(null);
    setActionSuccess(null);

    try {
      await api.recordAttendance(empId, date, selectedStatus);
      setActionSuccess(`Recorded status '${selectedStatus}' for date ${date}`);
      setSelectedDate('');
      fetchSummaries();
    } catch (err) {
      if (err.status === 409) {
        setError(`Conflict (409): Someone else already recorded attendance for ${date}.`);
      } else if (err.status === 403) {
        setError(`Forbidden (403): You do not have permission to record attendance for this employee.`);
      } else {
        setError(err.message || 'Failed to record attendance.');
      }
    } finally {
      setRecording(false);
    }
  };

  return (
    <div style={{ padding: '1.5rem', maxWidth: '1200px', margin: '0 auto' }}>
      {/* Filters & Toolbar */}
      <div className="glass-panel" style={{ padding: '1.25rem', marginBottom: '1.5rem', display: 'flex', flexWrap: 'wrap', gap: '1rem', alignItems: 'center', justifyContent: 'space-between' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', flexWrap: 'wrap' }}>
          <div>
            <label style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', display: 'block', marginBottom: '0.25rem' }}>Select Month:</label>
            <input
              type="month"
              value={month}
              onChange={(e) => setMonth(e.target.value)}
            />
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginTop: '1.25rem' }}>
            <input
              type="checkbox"
              id="onlyGapsToggle"
              checked={onlyGaps}
              onChange={(e) => setOnlyGaps(e.target.checked)}
              style={{ width: '1.1rem', height: '1.1rem', cursor: 'pointer' }}
            />
            <label htmlFor="onlyGapsToggle" style={{ fontSize: '0.9rem', cursor: 'pointer', userSelect: 'none' }}>
              Only Show Rows with Attendance Gaps
            </label>
          </div>
        </div>

        <button className="btn btn-secondary" onClick={fetchSummaries} disabled={loading}>
          🔄 Refresh
        </button>
      </div>

      {/* Alerts */}
      {error && (
        <div style={{ background: 'rgba(244, 63, 94, 0.15)', border: '1px solid rgba(244, 63, 94, 0.4)', color: '#f43f5e', padding: '0.875rem 1.25rem', borderRadius: '8px', marginBottom: '1.5rem' }}>
          ⚠️ <strong>Error:</strong> {error}
        </div>
      )}

      {actionSuccess && (
        <div style={{ background: 'rgba(52, 211, 153, 0.15)', border: '1px solid rgba(52, 211, 153, 0.4)', color: '#34d399', padding: '0.875rem 1.25rem', borderRadius: '8px', marginBottom: '1.5rem' }}>
          ✅ {actionSuccess}
        </div>
      )}

      {/* Data Table */}
      <div className="glass-panel" style={{ overflow: 'hidden' }}>
        {loading ? (
          <div style={{ padding: '3rem', textAlign: 'center', color: 'var(--text-secondary)' }}>
            Loading monthly attendance records...
          </div>
        ) : summaries.length === 0 ? (
          <div style={{ padding: '3rem', textAlign: 'center', color: 'var(--text-secondary)' }}>
            No employee attendance rows found for {month} {onlyGaps ? '(with gaps)' : ''}.
          </div>
        ) : (
          <div className="table-container">
            <table>
              <thead>
                <tr>
                  <th>Employee</th>
                  <th>Region</th>
                  <th>Calendar Days</th>
                  <th>Scheduled</th>
                  <th>Paid Leave (L)</th>
                  <th>Unpaid Days</th>
                  <th>Gaps (Unaccounted)</th>
                  <th>Payable Days</th>
                  <th>Action</th>
                </tr>
              </thead>
              <tbody>
                {summaries.map((emp) => {
                  const hasGaps = emp.unaccountedDays > 0;
                  const isExpanded = expandedEmpId === emp.employeeId;

                  return (
                    <React.Fragment key={emp.employeeId}>
                      <tr>
                        <td>
                          <strong>{emp.name}</strong>
                          <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>ID: {emp.employeeId}</div>
                        </td>
                        <td>{emp.region}</td>
                        <td>{emp.calendarDays}</td>
                        <td>{emp.scheduledDays}</td>
                        <td>{emp.paidLeaveDays}</td>
                        <td>{emp.unpaidDays}</td>
                        <td>
                          {hasGaps ? (
                            <span className="badge badge-gap">
                              ⚠️ GAP ({emp.unaccountedDays} missing)
                            </span>
                          ) : (
                            <span className="badge badge-ok">
                              ✓ Complete
                            </span>
                          )}
                        </td>
                        <td>
                          <strong style={{ fontSize: '1.05rem', color: 'var(--accent-blue)' }}>{emp.payableDays}</strong>
                        </td>
                        <td>
                          {hasGaps && (
                            <button
                              className="btn btn-secondary"
                              style={{ padding: '0.35rem 0.75rem', fontSize: '0.8rem' }}
                              onClick={() => setExpandedEmpId(isExpanded ? null : emp.employeeId)}
                            >
                              {isExpanded ? 'Hide Dates' : 'Fill Gaps'}
                            </button>
                          )}
                        </td>
                      </tr>

                      {/* Expanded gap filler row */}
                      {isExpanded && (
                        <tr>
                          <td colSpan={9} style={{ background: 'rgba(15, 23, 42, 0.4)', padding: '1.25rem' }}>
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                              <h4 style={{ fontSize: '0.9rem', color: 'var(--text-primary)' }}>
                                Missing Scheduled Dates for {emp.name}:
                              </h4>
                              
                              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem' }}>
                                {emp.unaccountedDates.map((dateStr) => (
                                  <button
                                    key={dateStr}
                                    className={`btn ${selectedDate === dateStr ? 'btn-primary' : 'btn-secondary'}`}
                                    style={{ padding: '0.3rem 0.6rem', fontSize: '0.8rem' }}
                                    onClick={() => setSelectedDate(dateStr)}
                                  >
                                    📅 {dateStr}
                                  </button>
                                ))}
                              </div>

                              {selectedDate && (
                                <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginTop: '0.5rem', background: 'rgba(255, 255, 255, 0.05)', padding: '0.875rem', borderRadius: '8px' }}>
                                  <span style={{ fontSize: '0.85rem' }}>Record for <strong>{selectedDate}</strong>:</span>
                                  
                                  <select
                                    value={selectedStatus}
                                    onChange={(e) => setSelectedStatus(e.target.value)}
                                    style={{ padding: '0.4rem 0.75rem' }}
                                  >
                                    <option value="P">P — Present</option>
                                    <option value="A">A — Absent</option>
                                    <option value="L">L — Paid Leave</option>
                                    <option value="U">U — Unpaid Leave</option>
                                    <option value="H">H — Half Day</option>
                                  </select>

                                  <button
                                    className="btn btn-primary"
                                    style={{ padding: '0.4rem 1rem' }}
                                    disabled={recording || !canWriteForEmp(emp.employeeId)}
                                    onClick={() => handleRecordAttendance(emp.employeeId, selectedDate)}
                                  >
                                    {recording ? 'Saving...' : 'Save Attendance'}
                                  </button>
                                </div>
                              )}
                            </div>
                          </td>
                        </tr>
                      )}
                    </React.Fragment>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};
