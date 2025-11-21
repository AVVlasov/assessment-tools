import { configureStore } from '@reduxjs/toolkit';
import { eventApi } from './api/eventApi';
import { teamsApi } from './api/teamsApi';
import { expertsApi } from './api/expertsApi';
import { criteriaApi } from './api/criteriaApi';
import { ratingsApi } from './api/ratingsApi';

export const store = configureStore({
  reducer: {
    [eventApi.reducerPath]: eventApi.reducer,
    [teamsApi.reducerPath]: teamsApi.reducer,
    [expertsApi.reducerPath]: expertsApi.reducer,
    [criteriaApi.reducerPath]: criteriaApi.reducer,
    [ratingsApi.reducerPath]: ratingsApi.reducer
  },
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware().concat(
      eventApi.middleware,
      teamsApi.middleware,
      expertsApi.middleware,
      criteriaApi.middleware,
      ratingsApi.middleware
    )
});

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;

