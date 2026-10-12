const TOKEN_KEY = 'attendance_gaps_token';
const USER_KEY = 'attendance_gaps_user';

export const authService = {
  getToken() {
    return sessionStorage.getItem(TOKEN_KEY);
  },

  getUser() {
    const raw = sessionStorage.getItem(USER_KEY);
    return raw ? JSON.parse(raw) : null;
  },

  setSession(token, user) {
    sessionStorage.setItem(TOKEN_KEY, token);
    sessionStorage.setItem(USER_KEY, JSON.stringify(user));
  },

  clearSession() {
    sessionStorage.removeItem(TOKEN_KEY);
    sessionStorage.removeItem(USER_KEY);
  },

  isAuthenticated() {
    return !!this.getToken();
  }
};
