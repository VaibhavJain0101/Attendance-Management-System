import { apiSlice } from '../../app/store/apiSlice';

export const usersApi = apiSlice.injectEndpoints({
  endpoints: (builder) => ({
    getUsers: builder.query({
      query: (params) => ({
        url: '/users',
        params
      }),
      providesTags: ['Users']
    }),
    getTeamUsers: builder.query({
      query: (params) => ({
        url: '/users/team',
        params
      }),
      providesTags: ['Users']
    }),
    createUser: builder.mutation({
      query: (body) => ({
        url: '/admin/create-user',
        method: 'POST',
        body
      }),
      invalidatesTags: ['Users']
    }),
    updateUser: builder.mutation({
      query: ({ userId, body }) => ({
        url: `/users/${userId}`,
        method: 'PATCH',
        body
      }),
      invalidatesTags: ['Users']
    }),
    resetUserPassword: builder.mutation({
      query: ({ userId, body }) => ({
        url: `/users/${userId}/reset-password`,
        method: 'PATCH',
        body
      }),
      invalidatesTags: ['Users']
    })
  })
});

export const {
  useGetUsersQuery,
  useGetTeamUsersQuery,
  useCreateUserMutation,
  useUpdateUserMutation,
  useResetUserPasswordMutation
} = usersApi;
