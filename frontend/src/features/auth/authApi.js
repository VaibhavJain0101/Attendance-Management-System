import { apiSlice } from '../../app/store/apiSlice';

export const authApi = apiSlice.injectEndpoints({
  endpoints: (builder) => ({
    login: builder.mutation({
      query: (payload) => ({
        url: '/auth/login',
        method: 'POST',
        body: payload
      })
    }),
    signup: builder.mutation({
      query: (payload) => ({
        url: '/auth/signup',
        method: 'POST',
        body: payload
      })
    }),
    changePassword: builder.mutation({
      query: (payload) => ({
        url: '/auth/change-password',
        method: 'POST',
        body: payload
      })
    })
  })
});

export const { useLoginMutation, useSignupMutation, useChangePasswordMutation } = authApi;
