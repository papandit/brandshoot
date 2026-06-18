// Shim: the user app's pages import `useAuth` from here. Re-export the single
// shared auth so there is one login/session for the whole merged frontend.
export { AuthProvider, useAuth } from '../../context/AuthContext';
