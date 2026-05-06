import { useEffect, useMemo, useState } from 'react';
import { useForm } from 'react-hook-form';
import { motion } from 'framer-motion';
import {
  Building2,
  MapPinned,
  Pencil,
  Save,
  Settings,
  ShieldAlert,
  Trash2,
  X
} from 'lucide-react';
import { toast } from 'sonner';
import PageHeader from '../components/ui/page-header';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Textarea } from '../components/ui/textarea';
import { FormRow, Label } from '../components/ui/form';
import { Badge } from '../components/ui/badge';
import {
  Table,
  TableCell,
  TableContainer,
  TableHead,
  TableHeaderCell,
  TableRow
} from '../components/ui/table';
import Loading from '../components/common/Loading';
import ErrorMessage from '../components/common/ErrorMessage';
import GeofenceMapPicker from '../components/geofence/GeofenceMapPicker';
import {
  useCreateGeofenceMutation,
  useDeleteGeofenceMutation,
  useGetAdminGeofencesQuery,
  useGetGeofenceSettingsQuery,
  useGetGeoViolationsQuery,
  useUpdateGeofenceMutation,
  useUpdateGeofenceSettingsMutation
} from '../features/geofence/geofenceApi';

const officeDefaultValues = {
  officeName: '',
  latitude: 28.6139,
  longitude: 77.209,
  radiusInMeters: 250,
  address: '',
  city: '',
  state: '',
  country: '',
  googleMapUrl: '',
  isActive: true
};

const settingsDefaultValues = {
  geofenceEnabled: true,
  strictGeofenceMode: true,
  allowOutsideAttendance: false,
  autoMarkSuspicious: true,
  allowWfhBypass: true,
  maximumAllowedRadius: 2000,
  gpsAccuracyThreshold: 120
};

const GeofenceAdminPage = () => {
  const [editingId, setEditingId] = useState(null);
  const [violationPage, setViolationPage] = useState(1);

  const officesQuery = useGetAdminGeofencesQuery({ includeInactive: true });
  const settingsQuery = useGetGeofenceSettingsQuery();
  const violationsQuery = useGetGeoViolationsQuery({ page: violationPage, limit: 10 });

  const [createOffice, createOfficeState] = useCreateGeofenceMutation();
  const [updateOffice, updateOfficeState] = useUpdateGeofenceMutation();
  const [deleteOffice, deleteOfficeState] = useDeleteGeofenceMutation();
  const [updateSettings, updateSettingsState] = useUpdateGeofenceSettingsMutation();

  const officeForm = useForm({ defaultValues: officeDefaultValues });
  const settingsForm = useForm({ defaultValues: settingsDefaultValues });
  const officeErrors = officeForm.formState.errors;

  const offices = officesQuery.data?.data || [];

  useEffect(() => {
    if (settingsQuery.data?.data) {
      const data = settingsQuery.data.data;
      settingsForm.reset({
        geofenceEnabled: data.geofenceEnabled,
        strictGeofenceMode: data.strictGeofenceMode,
        allowOutsideAttendance: data.allowOutsideAttendance,
        autoMarkSuspicious: data.autoMarkSuspicious,
        allowWfhBypass: data.allowWfhBypass,
        maximumAllowedRadius: data.maximumAllowedRadius,
        gpsAccuracyThreshold: data.gpsAccuracyThreshold
      });
    }
  }, [settingsQuery.data]);

  const watchedLatitude = officeForm.watch('latitude');
  const watchedLongitude = officeForm.watch('longitude');
  const watchedAddress = officeForm.watch('address');
  const watchedCity = officeForm.watch('city');
  const watchedState = officeForm.watch('state');
  const watchedCountry = officeForm.watch('country');
  const watchedGoogleMapUrl = officeForm.watch('googleMapUrl');
  const radiusPreview = officeForm.watch('radiusInMeters');

  const maximumAllowedRadius = settingsForm.watch('maximumAllowedRadius');

  const selectedLocation = useMemo(
    () => ({
      latitude: Number(watchedLatitude),
      longitude: Number(watchedLongitude),
      radiusInMeters: Number(radiusPreview),
      address: watchedAddress,
      city: watchedCity,
      state: watchedState,
      country: watchedCountry,
      googleMapUrl: watchedGoogleMapUrl
    }),
    [
      watchedLatitude,
      watchedLongitude,
      radiusPreview,
      watchedAddress,
      watchedCity,
      watchedState,
      watchedCountry,
      watchedGoogleMapUrl
    ]
  );

  const isOfficeSaving = createOfficeState.isLoading || updateOfficeState.isLoading;

  const handleUseCurrentLocation = () => {
    if (!navigator.geolocation) {
      toast.error('Geolocation is not supported by this browser.');
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (position) => {
        officeForm.setValue('latitude', Number(position.coords.latitude));
        officeForm.setValue('longitude', Number(position.coords.longitude));
        officeForm.setValue(
          'googleMapUrl',
          `https://www.google.com/maps?q=${position.coords.latitude},${position.coords.longitude}`
        );
      },
      () => toast.error('Unable to get current location. Please allow GPS permission.'),
      { enableHighAccuracy: true, timeout: 10000 }
    );
  };

  const handleLocationChange = (data) => {
    Object.entries(data).forEach(([key, value]) => officeForm.setValue(key, value));
  };

  const onSubmitOffice = officeForm.handleSubmit(
    async (values) => {
      try {
        const payload = {
          ...values,
          latitude: Number(values.latitude),
          longitude: Number(values.longitude),
          radiusInMeters: Number(values.radiusInMeters)
        };

        if (editingId) {
          await updateOffice({ id: editingId, body: payload }).unwrap();
          toast.success('Office geofence updated successfully.');
        } else {
          await createOffice(payload).unwrap();
          toast.success('Office geofence created successfully.');
        }

        officeForm.reset(officeDefaultValues);
        setEditingId(null);
      } catch (error) {
        toast.error(error?.data?.message || 'Failed to save office geofence.');
      }
    },
    (errors) => {
      const firstError = Object.values(errors)[0];
      toast.error(firstError?.message || 'Please fix the highlighted office form fields.');
    }
  );

  const onSubmitSettings = settingsForm.handleSubmit(async (values) => {
    try {
      await updateSettings({
        ...values,
        maximumAllowedRadius: Number(values.maximumAllowedRadius),
        gpsAccuracyThreshold: Number(values.gpsAccuracyThreshold)
      }).unwrap();
      toast.success('Geofence settings updated.');
    } catch (error) {
      toast.error(error?.data?.message || 'Failed to update geofence settings.');
    }
  });

  const handleEdit = (office) => {
    setEditingId(office._id);
    officeForm.reset({
      officeName: office.officeName,
      latitude: office.latitude,
      longitude: office.longitude,
      radiusInMeters: office.radiusInMeters,
      address: office.address || '',
      city: office.city || '',
      state: office.state || '',
      country: office.country || '',
      googleMapUrl: office.googleMapUrl || '',
      isActive: office.isActive
    });
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this office geofence?')) return;

    try {
      await deleteOffice(id).unwrap();
      toast.success('Office geofence deleted successfully.');
      if (editingId === id) {
        setEditingId(null);
        officeForm.reset(officeDefaultValues);
      }
    } catch (error) {
      toast.error(error?.data?.message || 'Failed to delete office geofence.');
    }
  };

  if (officesQuery.isLoading || settingsQuery.isLoading) {
    return <Loading label="Loading geofence management..." />;
  }

  if (officesQuery.error) {
    return <ErrorMessage message={officesQuery.error?.data?.message || 'Failed to load office geofences.'} />;
  }

  return (
    <div className="stack">
      <PageHeader
        title="Geofence Management"
        description="Create office geofences, configure policy controls, and monitor geo violations in real time."
      />

      <div className="grid gap-6 xl:grid-cols-[1.2fr_0.8fr]">
        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <MapPinned size={18} className="text-emerald-600" />
              <CardTitle>{editingId ? 'Edit Office Geofence' : 'Create Office Geofence'}</CardTitle>
            </div>
            {editingId ? <Badge variant="info">Editing Mode</Badge> : null}
          </CardHeader>
          <CardContent>
            <form className="space-y-4" onSubmit={onSubmitOffice} noValidate>
              <div className="grid gap-4 md:grid-cols-2">
                <FormRow>
                  <Label>Office Name</Label>
                  <Input
                    {...officeForm.register('officeName', {
                      required: 'Office name is required.',
                      minLength: { value: 2, message: 'Office name must be at least 2 characters.' }
                    })}
                    placeholder="Head Office"
                  />
                  {officeErrors.officeName ? <p className="error-text">{officeErrors.officeName.message}</p> : null}
                </FormRow>

                <FormRow>
                  <Label>Radius (meters)</Label>
                  <Input
                    type="number"
                    min="10"
                    {...officeForm.register('radiusInMeters', {
                      required: 'Radius is required.',
                      min: { value: 10, message: 'Radius must be at least 10 meters.' },
                      validate: (value) =>
                        Number(value) <= Number(maximumAllowedRadius || 5000) ||
                        `Radius cannot exceed ${Number(maximumAllowedRadius || 5000)} meters.`
                    })}
                  />
                  {officeErrors.radiusInMeters ? <p className="error-text">{officeErrors.radiusInMeters.message}</p> : null}
                </FormRow>
              </div>

              <div className="grid gap-4 md:grid-cols-2">
                <FormRow>
                  <Label>Latitude</Label>
                  <Input
                    type="number"
                    step="0.000001"
                    {...officeForm.register('latitude', {
                      required: 'Latitude is required.',
                      min: { value: -90, message: 'Latitude must be between -90 and 90.' },
                      max: { value: 90, message: 'Latitude must be between -90 and 90.' }
                    })}
                  />
                  {officeErrors.latitude ? <p className="error-text">{officeErrors.latitude.message}</p> : null}
                </FormRow>
                <FormRow>
                  <Label>Longitude</Label>
                  <Input
                    type="number"
                    step="0.000001"
                    {...officeForm.register('longitude', {
                      required: 'Longitude is required.',
                      min: { value: -180, message: 'Longitude must be between -180 and 180.' },
                      max: { value: 180, message: 'Longitude must be between -180 and 180.' }
                    })}
                  />
                  {officeErrors.longitude ? <p className="error-text">{officeErrors.longitude.message}</p> : null}
                </FormRow>
              </div>

              <FormRow>
                <Label>Address</Label>
                <Textarea {...officeForm.register('address')} placeholder="Street address" />
              </FormRow>

              <div className="grid gap-4 md:grid-cols-3">
                <FormRow>
                  <Label>City</Label>
                  <Input {...officeForm.register('city')} />
                </FormRow>
                <FormRow>
                  <Label>State</Label>
                  <Input {...officeForm.register('state')} />
                </FormRow>
                <FormRow>
                  <Label>Country</Label>
                  <Input {...officeForm.register('country')} />
                </FormRow>
              </div>

              <FormRow>
                <Label>Google Map URL</Label>
                <Input {...officeForm.register('googleMapUrl')} placeholder="Auto-generated" />
              </FormRow>

              <FormRow>
                <Label className="flex items-center justify-between">
                  <span>Active Office</span>
                  <input type="checkbox" className="h-4 w-4" {...officeForm.register('isActive')} />
                </Label>
              </FormRow>

              <FormRow>
                <Label>Radius Slider Preview: {radiusPreview || 0}m</Label>
                <input
                  type="range"
                  min="10"
                  max={Number(maximumAllowedRadius) || 5000}
                  className="w-full"
                  value={Number(radiusPreview) || 10}
                  onChange={(event) => officeForm.setValue('radiusInMeters', Number(event.target.value))}
                />
              </FormRow>

              <GeofenceMapPicker
                value={selectedLocation}
                onChange={handleLocationChange}
                offices={offices}
                onUseCurrentLocation={handleUseCurrentLocation}
              />

              <div className="inline-actions">
                <Button type="submit" disabled={isOfficeSaving}>
                  <Save size={16} />
                  {isOfficeSaving ? 'Saving...' : editingId ? 'Update Office' : 'Create Office'}
                </Button>
                {editingId ? (
                  <Button
                    type="button"
                    variant="secondary"
                    onClick={() => {
                      setEditingId(null);
                      officeForm.reset(officeDefaultValues);
                    }}
                  >
                    <X size={16} />
                    Cancel Edit
                  </Button>
                ) : null}
              </div>
            </form>
          </CardContent>
        </Card>

        <div className="stack">
          <Card>
            <CardHeader>
              <div className="flex items-center gap-2">
                <Settings size={18} className="text-blue-600" />
                <CardTitle>Geofence Policy Settings</CardTitle>
              </div>
            </CardHeader>
            <CardContent>
              <form className="space-y-3" onSubmit={onSubmitSettings}>
                {[
                  ['geofenceEnabled', 'Enable geofence validation'],
                  ['strictGeofenceMode', 'Strict geofence mode'],
                  ['allowOutsideAttendance', 'Allow outside attendance'],
                  ['autoMarkSuspicious', 'Auto mark suspicious'],
                  ['allowWfhBypass', 'Allow work-from-home bypass']
                ].map(([field, label]) => (
                  <label key={field} className="flex items-center justify-between rounded-xl border border-slate-200 bg-white/80 px-3 py-2 text-sm">
                    <span>{label}</span>
                    <input type="checkbox" className="h-4 w-4" {...settingsForm.register(field)} />
                  </label>
                ))}

                <FormRow>
                  <Label>Maximum Allowed Radius (meters)</Label>
                  <Input type="number" min="50" {...settingsForm.register('maximumAllowedRadius', { required: true })} />
                </FormRow>

                <FormRow>
                  <Label>GPS Accuracy Threshold (meters)</Label>
                  <Input type="number" min="10" {...settingsForm.register('gpsAccuracyThreshold', { required: true })} />
                </FormRow>

                <Button type="submit" disabled={updateSettingsState.isLoading}>
                  <Save size={16} />
                  {updateSettingsState.isLoading ? 'Updating...' : 'Save Settings'}
                </Button>
              </form>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <div className="flex items-center gap-2">
                <Building2 size={18} className="text-violet-600" />
                <CardTitle>Configured Offices</CardTitle>
              </div>
            </CardHeader>
            <CardContent className="space-y-3">
              {offices.length === 0 ? <p className="small">No office geofences configured yet.</p> : null}
              {offices.map((office) => (
                <motion.div key={office._id} whileHover={{ y: -2 }} className="rounded-xl border border-slate-200 bg-white/80 p-3">
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <p className="font-semibold text-slate-800">{office.officeName}</p>
                      <p className="small">
                        {office.latitude.toFixed(5)}, {office.longitude.toFixed(5)}
                      </p>
                      <div className="mt-2 inline-actions">
                        <Badge variant={office.isActive ? 'default' : 'danger'}>
                          {office.isActive ? 'Active' : 'Inactive'}
                        </Badge>
                        <Badge variant="neutral">{office.radiusInMeters}m</Badge>
                      </div>
                    </div>
                    <div className="inline-actions">
                      <Button type="button" size="sm" variant="secondary" onClick={() => handleEdit(office)}>
                        <Pencil size={14} />
                      </Button>
                      <Button
                        type="button"
                        size="sm"
                        variant="danger"
                        onClick={() => handleDelete(office._id)}
                        disabled={deleteOfficeState.isLoading}
                      >
                        <Trash2 size={14} />
                      </Button>
                    </div>
                  </div>
                </motion.div>
              ))}
            </CardContent>
          </Card>
        </div>
      </div>

      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <ShieldAlert size={18} className="text-rose-600" />
            <CardTitle>Geo Violations & Fraud Alerts</CardTitle>
          </div>
        </CardHeader>
        <CardContent>
          {violationsQuery.error ? <ErrorMessage message={violationsQuery.error?.data?.message} /> : null}
          <TableContainer>
            <Table className="min-w-[850px]">
              <TableHead>
                <tr>
                  <TableHeaderCell>Employee</TableHeaderCell>
                  <TableHeaderCell>Action</TableHeaderCell>
                  <TableHeaderCell>Geo Status</TableHeaderCell>
                  <TableHeaderCell>Distance</TableHeaderCell>
                  <TableHeaderCell>Office</TableHeaderCell>
                  <TableHeaderCell>Timestamp</TableHeaderCell>
                </tr>
              </TableHead>
              <tbody>
                {(violationsQuery.data?.data || []).map((row) => (
                  <TableRow key={row._id}>
                    <TableCell>{row.employeeId?.name || '-'}</TableCell>
                    <TableCell>
                      <Badge variant={row.actionTaken === 'BLOCKED' ? 'danger' : row.actionTaken.includes('SUSPICIOUS') ? 'warning' : 'info'}>
                        {row.actionTaken}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <Badge variant={row.geoStatus === 'inside_geofence' ? 'default' : 'warning'}>{row.geoStatus}</Badge>
                    </TableCell>
                    <TableCell>{row.distance ? `${row.distance.toFixed(1)} m` : '-'}</TableCell>
                    <TableCell>{row.officeLocationId?.officeName || '-'}</TableCell>
                    <TableCell>{new Date(row.createdAt).toLocaleString()}</TableCell>
                  </TableRow>
                ))}
              </tbody>
            </Table>
          </TableContainer>

          <div className="pagination">
            <Button
              type="button"
              variant="secondary"
              size="sm"
              onClick={() => setViolationPage((p) => Math.max(1, p - 1))}
              disabled={violationPage === 1}
            >
              Previous
            </Button>
            <span>Page {violationPage}</span>
            <Button type="button" variant="secondary" size="sm" onClick={() => setViolationPage((p) => p + 1)}>
              Next
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default GeofenceAdminPage;
