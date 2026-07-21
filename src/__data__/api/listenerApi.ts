import { createApi, fetchBaseQuery } from '@reduxjs/toolkit/query/react'
import type {
  CreateListenerRatingRequest,
  ListenerHallPayload,
  ListenerRating,
  ListenerStatsResponse,
  UpdateListenerReactionsRequest,
} from '../../types'
import { URLs } from '../urls'

export const listenerApi = createApi({
  reducerPath: 'listenerApi',
  baseQuery: fetchBaseQuery({ baseUrl: URLs.apiBase }),
  tagTypes: ['ListenerHall', 'ListenerStats'],
  endpoints: (builder) => ({
    getListenerHall: builder.query<ListenerHallPayload, { token: string; sessionId?: string }>({
      query: ({ token, sessionId }) =>
        `/listener/hall/${token}${sessionId ? `?sessionId=${encodeURIComponent(sessionId)}` : ''}`,
      providesTags: ['ListenerHall'],
    }),
    getListenerPlace: builder.query<{ place: number; count: number }, { token: string; teamId?: string }>({
      query: ({ token, teamId }) =>
        `/listener/hall/${token}/place${teamId ? `?teamId=${teamId}` : ''}`,
    }),
    createListenerRating: builder.mutation<
      { rating: ListenerRating; place: number },
      CreateListenerRatingRequest
    >({
      query: (body) => ({ url: '/listener/ratings', method: 'POST', body }),
      invalidatesTags: ['ListenerStats'],
    }),
    updateListenerReactions: builder.mutation<
      { rating: ListenerRating },
      UpdateListenerReactionsRequest
    >({
      query: (body) => ({ url: '/listener/ratings/reactions', method: 'POST', body }),
      invalidatesTags: ['ListenerStats'],
    }),
    getListenerStats: builder.query<ListenerStatsResponse, { eventId: string; hallId?: string }>({
      query: ({ eventId, hallId }) =>
        `/listener/stats?eventId=${eventId}${hallId && hallId !== 'all' ? `&hallId=${hallId}` : ''}`,
      serializeQueryArgs: ({ queryArgs }) => {
        const { eventId, hallId } = queryArgs
        return hallId && hallId !== 'all' ? { eventId, hallId } : { eventId }
      },
      providesTags: ['ListenerStats'],
    }),
    resetSpeakerRatings: builder.mutation<{ deletedCount: number }, string>({
      query: (teamId) => ({ url: `/listener/ratings/speaker/${teamId}`, method: 'DELETE' }),
      invalidatesTags: ['ListenerHall', 'ListenerStats'],
    }),
    resetHallRatings: builder.mutation<{ deletedCount: number }, string>({
      query: (hallId) => ({ url: `/listener/ratings/hall/${hallId}`, method: 'DELETE' }),
      invalidatesTags: ['ListenerHall', 'ListenerStats'],
    }),
    resetEventRatings: builder.mutation<{ deletedCount: number }, string>({
      query: (eventId) => ({ url: `/listener/ratings/event/${eventId}`, method: 'DELETE' }),
      invalidatesTags: ['ListenerHall', 'ListenerStats'],
    }),
  }),
})

export const {
  useGetListenerHallQuery,
  useGetListenerPlaceQuery,
  useLazyGetListenerPlaceQuery,
  useCreateListenerRatingMutation,
  useUpdateListenerReactionsMutation,
  useGetListenerStatsQuery,
  useResetSpeakerRatingsMutation,
  useResetHallRatingsMutation,
  useResetEventRatingsMutation,
} = listenerApi
