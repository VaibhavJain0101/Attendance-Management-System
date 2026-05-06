import { createSlice } from '@reduxjs/toolkit';
import { clearAuthStorage, getStoredToken, getStoredUser, setAuthStorage } from '../../utils/storage';

const normalizeAuthPayload = (payload) => ({
  token: payload.token,
  user: {
    ...payload.user,
    role: String(payload.user?.role || '').toLowerCase()
  }
});

const storedUser = getStoredUser();

const initialState = {
  token: getStoredToken(),
  user: storedUser ? { ...storedUser, role: String(storedUser.role || '').toLowerCase() } : null,
  isAuthenticated: Boolean(getStoredToken())
};

const authSlice = createSlice({
  name: 'auth',
  initialState,
  reducers: {
    authLoggedIn: (state, action) => {
      const normalized = normalizeAuthPayload(action.payload);
      state.token = normalized.token;
      state.user = normalized.user;
      state.isAuthenticated = true;
      setAuthStorage(normalized);
    },
    authLoggedOut: (state) => {
      state.token = null;
      state.user = null;
      state.isAuthenticated = false;
      clearAuthStorage();
    }
  }
});

export const { authLoggedIn, authLoggedOut } = authSlice.actions;
export default authSlice.reducer;
