import { createApi, fetchBaseQuery } from '@reduxjs/toolkit/query/react';
import { Rating, CreateRatingRequest, TeamStatistics, Top3Response } from '../../types';
import { URLs } from '../urls';

export const ratingsApi = createApi({
  reducerPath: 'ratingsApi',
  baseQuery: fetchBaseQuery({ baseUrl: URLs.apiBase }),
  tagTypes: ['Ratings', 'Statistics'],
  endpoints: (builder) => ({
    getRatings: builder.query<Rating[], { eventId?: string; expertId?: string; teamId?: string }>({
      query: (params) => ({
        url: '/ratings',
        params
      }),
      providesTags: ['Ratings']
    }),
    getTeamRatings: builder.query<Rating[], string>({
      query: (teamId) => `/ratings/team/${teamId}`,
      providesTags: ['Ratings']
    }),
    getExpertRatings: builder.query<Rating[], string>({
      query: (expertId) => `/ratings/expert/${expertId}`,
      providesTags: ['Ratings']
    }),
    getStatistics: builder.query<TeamStatistics[], { eventId?: string; type?: string }>({
      query: (params) => ({
        url: '/ratings/statistics',
        params
      }),
      providesTags: ['Statistics']
    }),
    getTop3: builder.query<Top3Response, { eventId?: string; type?: string }>({
      query: (params) => ({
        url: '/ratings/top3',
        params
      }),
      providesTags: ['Statistics']
    }),
    createRating: builder.mutation<Rating, CreateRatingRequest>({
      query: (body) => ({
        url: '/ratings',
        method: 'POST',
        body
      }),
      invalidatesTags: ['Ratings', 'Statistics']
    })
  })
});

export const {
  useGetRatingsQuery,
  useGetTeamRatingsQuery,
  useGetExpertRatingsQuery,
  useGetStatisticsQuery,
  useGetTop3Query,
  useCreateRatingMutation
} = ratingsApi;

