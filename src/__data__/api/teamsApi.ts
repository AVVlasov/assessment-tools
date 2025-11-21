import { createApi, fetchBaseQuery } from '@reduxjs/toolkit/query/react';
import { Team, CreateTeamRequest, UpdateTeamRequest } from '../../types';

const API_BASE = '/api';

export const teamsApi = createApi({
  reducerPath: 'teamsApi',
  baseQuery: fetchBaseQuery({ baseUrl: API_BASE }),
  tagTypes: ['Teams'],
  endpoints: (builder) => ({
    getTeams: builder.query<Team[], { type?: string }>({
      query: (params) => ({
        url: '/teams',
        params
      }),
      providesTags: ['Teams']
    }),
    getTeam: builder.query<Team, string>({
      query: (id) => `/teams/${id}`,
      providesTags: ['Teams']
    }),
    createTeam: builder.mutation<Team, CreateTeamRequest>({
      query: (body) => ({
        url: '/teams',
        method: 'POST',
        body
      }),
      invalidatesTags: ['Teams']
    }),
    updateTeam: builder.mutation<Team, { id: string; data: UpdateTeamRequest }>({
      query: ({ id, data }) => ({
        url: `/teams/${id}`,
        method: 'PUT',
        body: data
      }),
      invalidatesTags: ['Teams']
    }),
    deleteTeam: builder.mutation<void, string>({
      query: (id) => ({
        url: `/teams/${id}`,
        method: 'DELETE'
      }),
      invalidatesTags: ['Teams']
    }),
    toggleTeamActive: builder.mutation<Team, string>({
      query: (id) => ({
        url: `/teams/${id}/toggle-active`,
        method: 'PATCH'
      }),
      invalidatesTags: ['Teams']
    }),
    activateTeamForVoting: builder.mutation<Team, string>({
      query: (id) => ({
        url: `/teams/${id}/activate-for-voting`,
        method: 'PATCH'
      }),
      invalidatesTags: ['Teams']
    }),
    stopTeamVoting: builder.mutation<Team, string>({
      query: (id) => ({
        url: `/teams/${id}/stop-voting`,
        method: 'PATCH'
      }),
      invalidatesTags: ['Teams']
    }),
    stopAllVoting: builder.mutation<{ message: string; modifiedCount: number }, void>({
      query: () => ({
        url: '/teams/stop-all-voting/global',
        method: 'PATCH'
      }),
      invalidatesTags: ['Teams']
    }),
    getActiveTeamForVoting: builder.query<Team | null, void>({
      query: () => '/teams/active/voting',
      providesTags: ['Teams']
    })
  })
});

export const {
  useGetTeamsQuery,
  useGetTeamQuery,
  useCreateTeamMutation,
  useUpdateTeamMutation,
  useDeleteTeamMutation,
  useToggleTeamActiveMutation,
  useActivateTeamForVotingMutation,
  useStopTeamVotingMutation,
  useStopAllVotingMutation,
  useGetActiveTeamForVotingQuery
} = teamsApi;

