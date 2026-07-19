import { createApi, fetchBaseQuery } from '@reduxjs/toolkit/query/react'
import type { CreateHallRequest, Hall, UpdateHallRequest } from '../../types'
import { URLs } from '../urls'

export const hallsApi = createApi({
  reducerPath: 'hallsApi',
  baseQuery: fetchBaseQuery({ baseUrl: URLs.apiBase }),
  tagTypes: ['Hall', 'ListenerStats', 'ListenerHall'],
  endpoints: (builder) => ({
    getHalls: builder.query<Hall[], string>({
      query: (eventId) => `/halls?eventId=${eventId}`,
      providesTags: ['Hall'],
    }),
    createHall: builder.mutation<Hall, CreateHallRequest>({
      query: (body) => ({ url: '/halls', method: 'POST', body }),
      invalidatesTags: ['Hall', 'ListenerStats'],
    }),
    updateHall: builder.mutation<Hall, { id: string; data: UpdateHallRequest }>({
      query: ({ id, data }) => ({ url: `/halls/${id}`, method: 'PUT', body: data }),
      invalidatesTags: ['Hall', 'ListenerStats'],
    }),
    deleteHall: builder.mutation<{ message: string }, string>({
      query: (id) => ({ url: `/halls/${id}`, method: 'DELETE' }),
      invalidatesTags: ['Hall', 'ListenerStats'],
    }),
    nextHallSpeaker: builder.mutation<Hall, string>({
      query: (id) => ({ url: `/halls/${id}/next`, method: 'POST' }),
      invalidatesTags: ['Hall', 'ListenerStats', 'ListenerHall'],
    }),
    pauseHall: builder.mutation<Hall, string>({
      query: (id) => ({ url: `/halls/${id}/pause`, method: 'POST' }),
      invalidatesTags: ['Hall', 'ListenerStats', 'ListenerHall'],
    }),
    pauseAllHalls: builder.mutation<{ paused: number }, { eventId: string }>({
      query: (body) => ({ url: '/halls/pause-all', method: 'POST', body }),
      invalidatesTags: ['Hall', 'ListenerStats', 'ListenerHall'],
    }),
    restartHall: builder.mutation<Hall, { id: string; clearRatings?: boolean }>({
      query: ({ id, clearRatings }) => ({
        url: `/halls/${id}/restart`,
        method: 'POST',
        body: { clearRatings: !!clearRatings },
      }),
      invalidatesTags: ['Hall', 'ListenerStats', 'ListenerHall'],
    }),
    setHallSpeaker: builder.mutation<Hall, { id: string; speakerId: string }>({
      query: ({ id, speakerId }) => ({
        url: `/halls/${id}/set-speaker`,
        method: 'POST',
        body: { speakerId },
      }),
      invalidatesTags: ['Hall', 'ListenerStats', 'ListenerHall'],
    }),
    getHallQr: builder.query<
      { hall: Hall; currentSpeaker: Hall['currentSpeaker']; path: string; token: string },
      string
    >({
      query: (id) => `/halls/${id}/qr`,
    }),
  }),
})

export const {
  useGetHallsQuery,
  useCreateHallMutation,
  useUpdateHallMutation,
  useDeleteHallMutation,
  useNextHallSpeakerMutation,
  usePauseHallMutation,
  usePauseAllHallsMutation,
  useRestartHallMutation,
  useSetHallSpeakerMutation,
  useGetHallQrQuery,
  useLazyGetHallQrQuery,
} = hallsApi
