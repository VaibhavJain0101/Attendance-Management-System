import { apiSlice } from '../../app/store/apiSlice';

export const geofenceApi = apiSlice.injectEndpoints({
  endpoints: (builder) => ({
    getAdminGeofences: builder.query({
      query: (params) => ({
        url: '/admin/geofence',
        params
      }),
      providesTags: ['Geofence']
    }),
    createGeofence: builder.mutation({
      query: (body) => ({
        url: '/admin/geofence',
        method: 'POST',
        body
      }),
      invalidatesTags: ['Geofence']
    }),
    updateGeofence: builder.mutation({
      query: ({ id, body }) => ({
        url: `/admin/geofence/${id}`,
        method: 'PUT',
        body
      }),
      invalidatesTags: ['Geofence']
    }),
    deleteGeofence: builder.mutation({
      query: (id) => ({
        url: `/admin/geofence/${id}`,
        method: 'DELETE'
      }),
      invalidatesTags: ['Geofence']
    }),
    getGeofenceSettings: builder.query({
      query: () => ({
        url: '/admin/geofence/settings'
      }),
      providesTags: ['Geofence']
    }),
    updateGeofenceSettings: builder.mutation({
      query: (body) => ({
        url: '/admin/geofence/settings',
        method: 'PATCH',
        body
      }),
      invalidatesTags: ['Geofence']
    }),
    getGeoViolations: builder.query({
      query: (params) => ({
        url: '/admin/geofence/violations',
        params
      }),
      providesTags: ['GeoViolations']
    }),
    getActiveOffices: builder.query({
      query: () => ({
        url: '/geofence/offices'
      }),
      providesTags: ['Geofence']
    }),
    validateGeofence: builder.query({
      query: (params) => ({
        url: '/geofence/validate',
        params
      })
    }),
    getEmployeeGeofenceSettings: builder.query({
      query: () => ({
        url: '/geofence/settings'
      })
    })
  })
});

export const {
  useGetAdminGeofencesQuery,
  useCreateGeofenceMutation,
  useUpdateGeofenceMutation,
  useDeleteGeofenceMutation,
  useGetGeofenceSettingsQuery,
  useUpdateGeofenceSettingsMutation,
  useGetGeoViolationsQuery,
  useGetActiveOfficesQuery,
  useValidateGeofenceQuery,
  useLazyValidateGeofenceQuery,
  useGetEmployeeGeofenceSettingsQuery
} = geofenceApi;