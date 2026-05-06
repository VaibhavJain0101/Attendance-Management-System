import { useEffect, useMemo, useRef, useState } from 'react';
import { useSelector } from 'react-redux';
import {
  Camera,
  CameraOff,
  LocateFixed,
  MapPinned,
  Navigation,
  RefreshCw,
  ScanFace,
  ShieldCheck,
  TriangleAlert
} from 'lucide-react';
import { toast } from 'sonner';
import AttendanceTable from '../components/common/AttendanceTable';
import ErrorMessage from '../components/common/ErrorMessage';
import Loading from '../components/common/Loading';
import { useGetAttendanceQuery, usePunchInMutation, usePunchOutMutation } from '../features/attendance/attendanceApi';
import { useRequestOvertimeMutation } from '../features/overtime/overtimeApi';
import { ROLES } from '../utils/constants';
import PageHeader from '../components/ui/page-header';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { FormRow, Label } from '../components/ui/form';
import { Select } from '../components/ui/select';
import { Input } from '../components/ui/input';
import { Textarea } from '../components/ui/textarea';
import { Badge } from '../components/ui/badge';
import {
  useGetActiveOfficesQuery,
  useGetEmployeeGeofenceSettingsQuery,
  useLazyValidateGeofenceQuery
} from '../features/geofence/geofenceApi';

const buildDeviceFingerprint = () => {
  const parts = [
    navigator.userAgent || '',
    navigator.platform || '',
    navigator.language || '',
    String(new Date().getTimezoneOffset())
  ];

  return parts.join('|').slice(0, 500);
};

const AttendancePage = () => {
  const { user } = useSelector((state) => state.auth);
  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const streamRef = useRef(null);

  const [page, setPage] = useState(1);
  const [filters, setFilters] = useState({ startDate: '', endDate: '' });
  const [selfie, setSelfie] = useState('');
  const [location, setLocation] = useState(null);
  const [gpsAccuracy, setGpsAccuracy] = useState(null);
  const [geoValidation, setGeoValidation] = useState(null);
  const [cameraError, setCameraError] = useState('');
  const [actionError, setActionError] = useState('');
  const [locationError, setLocationError] = useState('');
  const [overtimeForm, setOvertimeForm] = useState({ attendanceId: '', requestedHours: 1, reason: '' });

  const attendanceQuery = useGetAttendanceQuery({
    page,
    limit: 10,
    ...(filters.startDate ? { startDate: filters.startDate } : {}),
    ...(filters.endDate ? { endDate: filters.endDate } : {})
  });

  const officesQuery = useGetActiveOfficesQuery(undefined, {
    skip: String(user?.role || '').toLowerCase() !== ROLES.EMPLOYEE
  });
  const geofenceSettingsQuery = useGetEmployeeGeofenceSettingsQuery(undefined, {
    skip: String(user?.role || '').toLowerCase() !== ROLES.EMPLOYEE
  });
  const [validateGeofence, validateGeofenceState] = useLazyValidateGeofenceQuery();

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

  const runGeofenceValidation = async (latitude, longitude, accuracy) => {
    try {
      const response = await validateGeofence({ latitude, longitude, gpsAccuracy: accuracy || 0 }).unwrap();
      setGeoValidation(response.data);
    } catch (error) {
      setGeoValidation(null);
      setLocationError(error?.data?.message || 'Failed to validate geofence.');
    }
  };

  const captureLocation = () => {
    setLocationError('');
    setActionError('');

    if (!navigator.geolocation) {
      setLocationError('Geolocation is not supported by this browser.');
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (position) => {
        const nextLocation = {
          latitude: position.coords.latitude,
          longitude: position.coords.longitude
        };

        setLocation(nextLocation);
        setGpsAccuracy(position.coords.accuracy || null);

        runGeofenceValidation(nextLocation.latitude, nextLocation.longitude, position.coords.accuracy);
      },
      () => {
        setLocationError('Unable to fetch geolocation. Please allow location permission.');
      },
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

    const payload = {
      selfie,
      location,
      gpsAccuracy,
      isMockedLocation: false,
      deviceFingerprint: buildDeviceFingerprint()
    };

    try {
      if (type === 'IN') {
        await punchIn(payload).unwrap();
        toast.success('Check-in completed successfully.');
      } else {
        await punchOut(payload).unwrap();
        toast.success('Check-out completed successfully.');
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
      toast.success('Overtime request submitted successfully.');
    } catch (error) {
      setActionError(error?.data?.message || 'Overtime request failed');
    }
  };

  const employeeRecords = attendanceQuery.data?.data || [];
  const overtimeCandidates = useMemo(() => employeeRecords.filter((item) => item.punchOut), [employeeRecords]);

  const activeOffices = officesQuery.data?.data || [];
  const nearestOffice = geoValidation?.office || null;

  if (attendanceQuery.isLoading) {
    return <Loading label="Loading attendance..." />;
  }

  if (attendanceQuery.error) {
    return <ErrorMessage message={attendanceQuery.error?.data?.message} />;
  }

  return (
    <div className="stack">
      <PageHeader
        title="Attendance"
        description="Capture attendance with live geolocation validation and geofence compliance checks."
      />

      {String(user?.role || '').toLowerCase() === ROLES.EMPLOYEE ? (
        <>
          <Card>
            <CardHeader>
              <CardTitle>Punch In / Punch Out</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="small mb-4">
                Start camera, capture selfie, capture geolocation, then submit attendance action.
              </p>
              <div className="inline-actions">
                <Button type="button" variant="secondary" onClick={startCamera}>
                  <Camera size={16} />
                  Start Camera
                </Button>
                <Button type="button" variant="secondary" onClick={stopCamera}>
                  <CameraOff size={16} />
                  Stop Camera
                </Button>
                <Button type="button" variant="secondary" onClick={captureSelfie}>
                  <ScanFace size={16} />
                  Capture Selfie
                </Button>
                <Button type="button" variant="secondary" onClick={captureLocation}>
                  <LocateFixed size={16} />
                  Capture Location
                </Button>
                <Button type="button" variant="secondary" onClick={captureLocation}>
                  <RefreshCw size={16} />
                  Retry Location
                </Button>
              </div>

              {cameraError ? <p className="error-text mt-3">{cameraError}</p> : null}
              {locationError ? <p className="error-text mt-2">{locationError}</p> : null}
              {actionError ? <p className="error-text mt-2">{actionError}</p> : null}

              <div className="media-grid">
                <div>
                  <video ref={videoRef} autoPlay playsInline className="video" />
                  <canvas ref={canvasRef} className="hidden" />
                </div>

                <div className="rounded-2xl border border-slate-200 bg-white/80 p-4">
                  {selfie ? <img src={selfie} alt="Captured selfie" className="preview" /> : <p className="small">No selfie captured yet.</p>}
                  <div className="mt-3 grid gap-2">
                    <p className="small inline-flex items-center gap-1">
                      <Navigation size={14} />
                      Coordinates:{' '}
                      {location
                        ? `${location.latitude.toFixed(5)}, ${location.longitude.toFixed(5)}`
                        : 'Not captured'}
                    </p>
                    <p className="small">GPS Accuracy: {gpsAccuracy ? `${Number(gpsAccuracy).toFixed(1)} m` : '-'}</p>
                  </div>
                </div>
              </div>

              <div className="mt-4 grid gap-4 lg:grid-cols-2">
                <Card className="!p-4">
                  <CardHeader className="mb-2 !p-0">
                    <div className="flex items-center gap-2">
                      <ShieldCheck size={16} className="text-emerald-600" />
                      <CardTitle className="text-base">Geofence Validation</CardTitle>
                    </div>
                  </CardHeader>
                  <CardContent className="!space-y-2 !p-0">
                    <p className="small">
                      Status:{' '}
                      {geoValidation ? (
                        <Badge variant={geoValidation.geoStatus === 'inside_geofence' ? 'default' : 'warning'}>
                          {geoValidation.geoStatus}
                        </Badge>
                      ) : (
                        '-'
                      )}
                    </p>
                    <p className="small">
                      Decision:{' '}
                      {geoValidation ? (
                        <Badge variant={geoValidation.allowed ? 'info' : 'danger'}>{geoValidation.decision}</Badge>
                      ) : (
                        '-'
                      )}
                    </p>
                    <p className="small">
                      Distance from Office:{' '}
                      {geoValidation?.distanceFromOffice !== null && geoValidation?.distanceFromOffice !== undefined
                        ? `${Number(geoValidation.distanceFromOffice).toFixed(2)} m`
                        : '-'}
                    </p>
                    <p className="small">Reason: {geoValidation?.reason || '-'}</p>
                    {validateGeofenceState.isFetching ? <p className="small">Validating location...</p> : null}
                    {geofenceSettingsQuery.data?.data ? (
                      <div className="inline-actions">
                        <Badge variant={geofenceSettingsQuery.data.data.geofenceEnabled ? 'default' : 'danger'}>
                          {geofenceSettingsQuery.data.data.geofenceEnabled ? 'Geofence Enabled' : 'Geofence Disabled'}
                        </Badge>
                        <Badge variant="neutral">
                          Accuracy Limit: {geofenceSettingsQuery.data.data.gpsAccuracyThreshold}m
                        </Badge>
                      </div>
                    ) : null}
                  </CardContent>
                </Card>

                <Card className="!p-4">
                  <CardHeader className="mb-2 !p-0">
                    <div className="flex items-center gap-2">
                      <MapPinned size={16} className="text-sky-600" />
                      <CardTitle className="text-base">Office Map Preview</CardTitle>
                    </div>
                  </CardHeader>
                  <CardContent className="!space-y-2 !p-0">
                    {nearestOffice?.googleMapUrl ? (
                      <iframe
                        title="Nearest office map"
                        src={`${nearestOffice.googleMapUrl}&output=embed`}
                        className="h-44 w-full rounded-xl border border-slate-200"
                      />
                    ) : activeOffices[0]?.googleMapUrl ? (
                      <iframe
                        title="Office map"
                        src={`${activeOffices[0].googleMapUrl}&output=embed`}
                        className="h-44 w-full rounded-xl border border-slate-200"
                      />
                    ) : (
                      <p className="small">No office map available.</p>
                    )}

                    {nearestOffice ? (
                      <div className="rounded-xl border border-slate-200 bg-white/80 p-2">
                        <p className="text-sm font-medium text-slate-700">Nearest Office: {nearestOffice.officeName}</p>
                        <p className="small">
                          Radius: {nearestOffice.radiusInMeters}m | {nearestOffice.address || 'Address unavailable'}
                        </p>
                      </div>
                    ) : null}
                  </CardContent>
                </Card>
              </div>

              <div className="inline-actions mt-4">
                <Button type="button" disabled={punchInState.isLoading} onClick={() => submitPunch('IN')}>
                  {punchInState.isLoading ? 'Submitting...' : 'Punch In'}
                </Button>
                <Button type="button" variant="secondary" disabled={punchOutState.isLoading} onClick={() => submitPunch('OUT')}>
                  {punchOutState.isLoading ? 'Submitting...' : 'Punch Out'}
                </Button>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Request Overtime</CardTitle>
            </CardHeader>
            <CardContent>
              <form className="form-grid" onSubmit={submitOvertime}>
                <FormRow>
                  <Label htmlFor="attendanceId">Attendance Record</Label>
                  <Select
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
                  </Select>
                </FormRow>

                <FormRow>
                  <Label htmlFor="hours">Requested Hours</Label>
                  <Input
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
                </FormRow>

                <FormRow>
                  <Label htmlFor="reason">Reason</Label>
                  <Textarea
                    id="reason"
                    value={overtimeForm.reason}
                    onChange={(event) => setOvertimeForm((prev) => ({ ...prev, reason: event.target.value }))}
                    required
                  />
                </FormRow>

                <Button type="submit" disabled={requestState.isLoading}>
                  {requestState.isLoading ? 'Submitting...' : 'Submit Overtime Request'}
                </Button>
              </form>
            </CardContent>
          </Card>
        </>
      ) : null}

      <Card>
        <CardHeader className="items-center">
          <div>
            <CardTitle>Attendance Records</CardTitle>
          </div>
          <Badge variant="info">Page {page}</Badge>
        </CardHeader>
        <CardContent>
          <div className="filters">
            <Input
              type="date"
              value={filters.startDate}
              onChange={(event) => setFilters((prev) => ({ ...prev, startDate: event.target.value }))}
            />
            <Input
              type="date"
              value={filters.endDate}
              onChange={(event) => setFilters((prev) => ({ ...prev, endDate: event.target.value }))}
            />
            <Button type="button" onClick={() => setPage(1)}>
              Apply
            </Button>
          </div>
          <div className="mt-4">
            <AttendanceTable rows={attendanceQuery.data?.data || []} />
          </div>
          <div className="pagination">
            <Button type="button" variant="secondary" size="sm" disabled={page === 1} onClick={() => setPage((p) => p - 1)}>
              Previous
            </Button>
            <span>Page {page}</span>
            <Button type="button" variant="secondary" size="sm" onClick={() => setPage((p) => p + 1)}>
              Next
            </Button>
          </div>
        </CardContent>
      </Card>

      {String(user?.role || '').toLowerCase() === ROLES.EMPLOYEE && !activeOffices.length ? (
        <Card>
          <CardContent className="flex items-center gap-2 pt-6">
            <TriangleAlert size={18} className="text-amber-500" />
            <p className="small">No active office geofence is configured by admin yet.</p>
          </CardContent>
        </Card>
      ) : null}
    </div>
  );
};

export default AttendancePage;