import { createApi, fetchBaseQuery } from '@reduxjs/toolkit/query/react';
import { Expert, CreateExpertRequest, UpdateExpertRequest } from '../../types';
import { URLs } from '../urls';

export const expertsApi = createApi({
  reducerPath: 'expertsApi',
  baseQuery: fetchBaseQuery({ baseUrl: URLs.apiBase }),
  tagTypes: ['Experts'],
  endpoints: (builder) => ({
    getExperts: builder.query<Expert[], { eventId?: string }>({
      query: (params) => ({
        url: '/experts',
        params
      }),
      providesTags: ['Experts']
    }),
    getExpertByToken: builder.query<Expert, string>({
      query: (token) => `/experts/by-token/${token}`,
      providesTags: ['Experts']
    }),
    getExpert: builder.query<Expert, string>({
      query: (id) => `/experts/${id}`,
      providesTags: ['Experts']
    }),
    createExpert: builder.mutation<Expert, CreateExpertRequest>({
      query: (body) => ({
        url: '/experts',
        method: 'POST',
        body
      }),
      invalidatesTags: ['Experts']
    }),
    updateExpert: builder.mutation<Expert, { id: string; data: UpdateExpertRequest }>({
      query: ({ id, data }) => ({
        url: `/experts/${id}`,
        method: 'PUT',
        body: data
      }),
      invalidatesTags: ['Experts']
    }),
    deleteExpert: builder.mutation<void, string>({
      query: (id) => ({
        url: `/experts/${id}`,
        method: 'DELETE'
      }),
      invalidatesTags: ['Experts']
    })
  })
});

export const {
  useGetExpertsQuery,
  useGetExpertByTokenQuery,
  useGetExpertQuery,
  useCreateExpertMutation,
  useUpdateExpertMutation,
  useDeleteExpertMutation
} = expertsApi;

