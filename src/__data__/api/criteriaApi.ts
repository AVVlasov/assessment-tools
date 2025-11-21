import { createApi, fetchBaseQuery } from '@reduxjs/toolkit/query/react';
import { Criteria, CreateCriteriaRequest, UpdateCriteriaRequest } from '../../types';

const API_BASE = '/api';

export const criteriaApi = createApi({
  reducerPath: 'criteriaApi',
  baseQuery: fetchBaseQuery({ baseUrl: API_BASE }),
  tagTypes: ['Criteria'],
  endpoints: (builder) => ({
    getCriteria: builder.query<Criteria[], void>({
      query: () => '/criteria',
      providesTags: ['Criteria']
    }),
    getCriteriaBlock: builder.query<Criteria, string>({
      query: (id) => `/criteria/${id}`,
      providesTags: ['Criteria']
    }),
    createCriteria: builder.mutation<Criteria, CreateCriteriaRequest>({
      query: (body) => ({
        url: '/criteria',
        method: 'POST',
        body
      }),
      invalidatesTags: ['Criteria']
    }),
    loadDefaultCriteria: builder.mutation<Criteria[], void>({
      query: () => ({
        url: '/criteria/default',
        method: 'POST'
      }),
      invalidatesTags: ['Criteria']
    }),
    updateCriteria: builder.mutation<Criteria, { id: string; data: UpdateCriteriaRequest }>({
      query: ({ id, data }) => ({
        url: `/criteria/${id}`,
        method: 'PUT',
        body: data
      }),
      invalidatesTags: ['Criteria']
    }),
    deleteCriteria: builder.mutation<void, string>({
      query: (id) => ({
        url: `/criteria/${id}`,
        method: 'DELETE'
      }),
      invalidatesTags: ['Criteria']
    })
  })
});

export const {
  useGetCriteriaQuery,
  useGetCriteriaBlockQuery,
  useCreateCriteriaMutation,
  useLoadDefaultCriteriaMutation,
  useUpdateCriteriaMutation,
  useDeleteCriteriaMutation
} = criteriaApi;

