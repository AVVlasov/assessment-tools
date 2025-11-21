import { createApi, fetchBaseQuery } from '@reduxjs/toolkit/query/react';
import { Event, CreateEventRequest, UpdateEventRequest } from '../../types';

const API_BASE = '/api';

export const eventApi = createApi({
  reducerPath: 'eventApi',
  baseQuery: fetchBaseQuery({ baseUrl: API_BASE }),
  tagTypes: ['Event'],
  endpoints: (builder) => ({
    getEvents: builder.query<Event[], void>({
      query: () => '/events',
      providesTags: ['Event']
    }),
    getEvent: builder.query<Event, string>({
      query: (id) => `/events/${id}`,
      providesTags: ['Event']
    }),
    createEvent: builder.mutation<Event, CreateEventRequest>({
      query: (body) => ({
        url: '/events',
        method: 'POST',
        body
      }),
      invalidatesTags: ['Event']
    }),
    updateEvent: builder.mutation<Event, { id: string; data: UpdateEventRequest }>({
      query: ({ id, data }) => ({
        url: `/events/${id}`,
        method: 'PUT',
        body: data
      }),
      invalidatesTags: ['Event']
    }),
    deleteEvent: builder.mutation<{ message: string; event: Event }, string>({
      query: (id) => ({
        url: `/events/${id}`,
        method: 'DELETE'
      }),
      invalidatesTags: ['Event']
    }),
    toggleVoting: builder.mutation<Event, string>({
      query: (id) => ({
        url: `/events/${id}/toggle-voting`,
        method: 'PATCH'
      }),
      invalidatesTags: ['Event']
    })
  })
});

export const {
  useGetEventsQuery,
  useGetEventQuery,
  useCreateEventMutation,
  useUpdateEventMutation,
  useDeleteEventMutation,
  useToggleVotingMutation
} = eventApi;

