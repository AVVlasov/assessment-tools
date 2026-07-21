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
      invalidatesTags: ['Hall', 'ListenerStats', 'ListenerHall'],
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
    shiftHallSpeaker: builder.mutation<Hall, { id: string; delta: 1 | -1; eventId: string }>({
      query: ({ id, delta }) => ({
        url: `/halls/${id}/shift`,
        method: 'POST',
        body: { delta },
      }),
      async onQueryStarted({ id, delta, eventId }, { dispatch, queryFulfilled }) {
        const patch = dispatch(
          hallsApi.util.updateQueryData('getHalls', eventId, (draft) => {
            const hall = draft.find((h) => h._id === id)
            if (!hall?.speakers?.length) return
            const cur = hall.currentSpeakerIndex || 0
            const next = Math.min(Math.max(0, cur + delta), hall.speakers.length - 1)
            if (next === cur) return
            if (delta > 0 && hall.speakers[cur]) {
              hall.speakers[cur].programDone = true
            }
            if (delta < 0 && hall.speakers[next]) {
              hall.speakers[next].programDone = false
            }
            hall.currentSpeakerIndex = next
            hall.currentSpeaker = hall.speakers[next]
            hall.ratingsCount = 0
            hall.averageScore = 0
          })
        )
        try {
          const { data } = await queryFulfilled
          dispatch(
            hallsApi.util.updateQueryData('getHalls', eventId, (draft) => {
              const idx = draft.findIndex((h) => h._id === id)
              if (idx >= 0) draft[idx] = data
            })
          )
        } catch {
          patch.undo()
        }
      },
      invalidatesTags: ['ListenerStats', 'ListenerHall'],
    }),
    shiftHallOrder: builder.mutation<Hall[], { id: string; delta: 1 | -1; eventId: string }>({
      query: ({ id, delta }) => ({
        url: `/halls/${id}/shift-order`,
        method: 'POST',
        body: { delta },
      }),
      async onQueryStarted({ id, delta, eventId }, { dispatch, queryFulfilled }) {
        const patch = dispatch(
          hallsApi.util.updateQueryData('getHalls', eventId, (draft) => {
            const idx = draft.findIndex((h) => h._id === id)
            const swapIdx = idx + delta
            if (idx < 0 || swapIdx < 0 || swapIdx >= draft.length) return
            const tmp = draft[idx]
            draft[idx] = draft[swapIdx]
            draft[swapIdx] = tmp
            draft.forEach((h, i) => {
              h.order = i
            })
          })
        )
        try {
          const { data } = await queryFulfilled
          dispatch(
            hallsApi.util.updateQueryData('getHalls', eventId, (draft) => {
              // Keep enriched speaker fields from cache while applying new order
              const byId = Object.fromEntries(draft.map((h) => [h._id, h]))
              const next = data.map((h, i) => {
                const prev = byId[h._id]
                return prev
                  ? { ...prev, order: h.order ?? i, name: h.name, color: h.color, num: h.num }
                  : { ...h, order: h.order ?? i }
              })
              draft.splice(0, draft.length, ...next)
            })
          )
        } catch {
          patch.undo()
        }
      },
      invalidatesTags: ['ListenerStats'],
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
  useShiftHallSpeakerMutation,
  useShiftHallOrderMutation,
  useSetHallSpeakerMutation,
  useGetHallQrQuery,
  useLazyGetHallQrQuery,
} = hallsApi
