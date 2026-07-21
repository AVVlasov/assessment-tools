import { createApi, fetchBaseQuery } from '@reduxjs/toolkit/query/react'
import type {
  CreateReadinessChecklistRequest,
  ReadinessChecklist,
  UpdateReadinessChecklistRequest,
} from '../../types'
import { URLs } from '../urls'

export const checklistsApi = createApi({
  reducerPath: 'checklistsApi',
  baseQuery: fetchBaseQuery({ baseUrl: URLs.apiBase }),
  tagTypes: ['Checklist'],
  endpoints: (builder) => ({
    getChecklists: builder.query<ReadinessChecklist[], string>({
      query: (eventId) => `/checklists?eventId=${eventId}`,
      providesTags: ['Checklist'],
    }),
    createChecklist: builder.mutation<ReadinessChecklist, CreateReadinessChecklistRequest>({
      query: (body) => ({ url: '/checklists', method: 'POST', body }),
      invalidatesTags: ['Checklist'],
    }),
    updateChecklist: builder.mutation<
      ReadinessChecklist,
      { id: string; eventId: string; data: UpdateReadinessChecklistRequest }
    >({
      query: ({ id, data }) => ({ url: `/checklists/${id}`, method: 'PUT', body: data }),
      async onQueryStarted({ id, eventId, data }, { dispatch, queryFulfilled }) {
        const patch = dispatch(
          checklistsApi.util.updateQueryData('getChecklists', eventId, (draft) => {
            const row = draft.find((c) => c._id === id)
            if (!row) return
            if (data.name !== undefined) row.name = data.name
            if (data.type !== undefined) row.type = data.type
            if (data.order !== undefined) row.order = data.order
            if (data.widgets !== undefined) row.widgets = data.widgets
            if (data.items !== undefined) {
              row.items = data.items.map((it, i) => ({
                _id: it._id || row.items[i]?._id || `tmp-${Date.now()}-${i}`,
                text: it.text ?? '',
                done: !!it.done,
              }))
            }
          })
        )
        try {
          const { data: updated } = await queryFulfilled
          dispatch(
            checklistsApi.util.updateQueryData('getChecklists', eventId, (draft) => {
              const idx = draft.findIndex((c) => c._id === id)
              if (idx >= 0) draft[idx] = updated
            })
          )
        } catch {
          patch.undo()
        }
      },
    }),
    deleteChecklist: builder.mutation<{ message: string }, { id: string; eventId: string }>({
      query: ({ id }) => ({ url: `/checklists/${id}`, method: 'DELETE' }),
      invalidatesTags: ['Checklist'],
    }),
  }),
})

export const {
  useGetChecklistsQuery,
  useCreateChecklistMutation,
  useUpdateChecklistMutation,
  useDeleteChecklistMutation,
} = checklistsApi
