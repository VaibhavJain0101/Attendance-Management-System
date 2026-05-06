import { useEffect, useMemo, useRef, useState } from 'react';
import { useSelector } from 'react-redux';
import AttendanceTable from '../components/common/AttendanceTable';
import ErrorMessage from '../components/common/ErrorMessage';
import Loading from '../components/common/Loading';
import { useGetAttendanceQuery, usePunchInMutation, usePunchOutMutation } from '../features/attendance/attendanceApi';
import { useRequestOvertimeMutation } from '../features/overtime/overtimeApi';
import { ROLES } from '../utils/constants';

const AttendancePage = () => {
  const { user } = useSelector((state) => state.auth);
  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const streamRef = useRef(null);

  const [page, setPage] = useState(1);
  const [filters, setFilters] = useState({ startDate: '', endDate: '' });
  const [selfie, setSelfie] = useState('');
  const [location, setLocation] = useState(null);
  const [cameraError, setCameraError] = useState('');
  const [actionError, setActionError] = useState('');
  const [overtimeForm, setOvertimeForm] = useState({ attendanceId: '', requestedHours: 1, reason: '' });

  const attendanceQuery = useGetAttendanceQuery({
    page,
    limit: 10,
    ...(filters.startDate ? { startDate: filters.startDate } : {}),
    ...(filters.endDate ? { endDate: filters.endDate } : {})
  });

  const [punchIn, punchInState] = usePunchInMutation();
  const [punchOut, punchOutState] = usePunchOutMutation();
  const [requestOvertime, requestState] = useRequestOvertimeMutation();

  useEffect(() => {
    return () => {
      if (streamRef.current) {
        streamRef.current.getTracks().forEach((track) => track.stop());
      }
    };
  }, []);

  const startCamera = async () => {
    setCameraError('');
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: false });
      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
      }
    } catch (_error) {
      setCameraError('Unable to access camera. Please allow camera permission.');
    }
  };

  const stopCamera = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
    }
  };

  const captureSelfie = () => {
    if (!videoRef.current || !canvasRef.current) return;
    const video = videoRef.current;
    const canvas = canvasRef.current;
    canvas.width = video.videoWidth || 320;
    canvas.height = video.videoHeight || 240;

    const ctx = canvas.getContext('2d');
    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
    setSelfie(canvas.toDataURL('image/jpeg', 0.9));
  };

  const captureLocation = () => {
    if (!navigator.geolocation) {
      setActionError('Geolocation is not supported by this browser.');
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (position) => {
        setLocation({
          latitude: position.coords.latitude,
          longitude: position.coords.longitude
        });
      },
      () => setActionError('Unable to fetch geolocation. Please allow location permission.'),
      { enableHighAccuracy: true, timeout: 10000 }
    );
  };

  const submitPunch = async (type) => {
    setActionError('');
    if (!selfie) {
      setActionError('Capture selfie before punch action.');
      return;
    }

    if (!location) {
      setActionError('Capture geolocation before punch action.');
      return;
    }

    const payload = { selfie, location };

    try {
      if (type === 'IN') {
        await punchIn(payload).unwrap();
      } else {
        await punchOut(payload).unwrap();
      }
    } catch (error) {
      setActionError(error?.data?.message || 'Punch request failed');
    }
  };

  const submitOvertime = async (event) => {
    event.preventDefault();
    setActionError('');

    try {
      await requestOvertime({
        attendanceId: overtimeForm.attendanceId,
        requestedHours: Number(overtimeForm.requestedHours),
        reason: overtimeForm.reason
      }).unwrap();
      setOvertimeForm({ attendanceId: '', requestedHours: 1, reason: '' });
    } catch (error) {
      setActionError(error?.data?.message || 'Overtime request failed');
    }
  };

  const employeeRecords = attendanceQuery.data?.data || [];
  const overtimeCandidates = useMemo(() => employeeRecords.filter((item) => item.punchOut), [employeeRecords]);

  if (attendanceQuery.isLoading) {
    return <Loading label="Loading attendance..." />;
  }

  if (attendanceQuery.error) {
    return <ErrorMessage message={attendanceQuery.error?.data?.message} />;
  }

  return (
    <div className="stack">
      <h2>Attendance</h2>

      {String(user?.role || '').toLowerCase() === ROLES.EMPLOYEE ? (
        <>
          <section className="card">
            <h3>Punch In / Punch Out</h3>
            <p className="small">
              Start camera, capture selfie, capture geolocation, then submit punch action.
            </p>
            <div className="inline-actions">
              <button type="button" onClick={startCamera}>
                Start Camera
              </button>
              <button type="button" onClick={stopCamera}>
                Stop Camera
              </button>
              <button type="button" onClick={captureSelfie}>
                Capture Selfie
              </button>
              <button type="button" onClick={captureLocation}>
                Capture Location
              </button>
            </div>
            {cameraError ? <p className="error-text">{cameraError}</p> : null}
            {actionError ? <p className="error-text">{actionError}</p> : null}

            <div className="media-grid">
              <div>
                <video ref={videoRef} autoPlay playsInline className="video" />
                <canvas ref={canvasRef} className="hidden" />
              </div>
              <div>
                {selfie ? <img src={selfie} alt="Captured selfie" className="preview" /> : <p>No selfie captured yet.</p>}
                <p>
                  Location:{' '}
                  {location ? `${location.latitude.toFixed(4)}, ${location.longitude.toFixed(4)}` : 'Not captured'}
                </p>
              </div>
            </div>

            <div className="inline-actions">
              <button
                type="button"
                disabled={punchInState.isLoading}
                onClick={() => submitPunch('IN')}
              >
                {punchInState.isLoading ? 'Submitting...' : 'Punch In'}
              </button>
              <button
                type="button"
                disabled={punchOutState.isLoading}
                onClick={() => submitPunch('OUT')}
              >
                {punchOutState.isLoading ? 'Submitting...' : 'Punch Out'}
              </button>
            </div>
          </section>

          <section className="card">
            <h3>Request Overtime</h3>
            <form className="form-grid" onSubmit={submitOvertime}>
              <label htmlFor="attendanceId">Attendance Record</label>
              <select
                id="attendanceId"
                value={overtimeForm.attendanceId}
                onChange={(event) => setOvertimeForm((prev) => ({ ...prev, attendanceId: event.target.value }))}
                required
              >
                <option value="">Select attendance</option>
                {overtimeCandidates.map((row) => (
                  <option key={row._id} value={row._id}>
                    {row.dateKey} ({row.totalWorkingHours} hrs)
                  </option>
                ))}
              </select>

              <label htmlFor="hours">Requested Hours</label>
              <input
                id="hours"
                type="number"
                min="0.5"
                max="16"
                step="0.5"
                value={overtimeForm.requestedHours}
                onChange={(event) =>
                  setOvertimeForm((prev) => ({ ...prev, requestedHours: event.target.value }))
                }
                required
              />

              <label htmlFor="reason">Reason</label>
              <textarea
                id="reason"
                value={overtimeForm.reason}
                onChange={(event) => setOvertimeForm((prev) => ({ ...prev, reason: event.target.value }))}
                required
              />

              <button type="submit" disabled={requestState.isLoading}>
                {requestState.isLoading ? 'Submitting...' : 'Submit Overtime Request'}
              </button>
            </form>
          </section>
        </>
      ) : null}

      <section className="card">
        <h3>Attendance Records</h3>
        <div className="filters">
          <input
            type="date"
            value={filters.startDate}
            onChange={(event) => setFilters((prev) => ({ ...prev, startDate: event.target.value }))}
          />
          <input
            type="date"
            value={filters.endDate}
            onChange={(event) => setFilters((prev) => ({ ...prev, endDate: event.target.value }))}
          />
          <button type="button" onClick={() => setPage(1)}>
            Apply
          </button>
        </div>
        <AttendanceTable rows={attendanceQuery.data?.data || []} />
        <div className="pagination">
          <button type="button" disabled={page === 1} onClick={() => setPage((p) => p - 1)}>
            Previous
          </button>
          <span>Page {page}</span>
          <button type="button" onClick={() => setPage((p) => p + 1)}>
            Next
          </button>
        </div>
      </section>
    </div>
  );
};

export default AttendancePage;
